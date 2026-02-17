
## Fix: Bil forsvinder fra liste ved redigering

### Rodårsag (bekræftet)

Der er **to sammenhængende problemer** der begge skal løses:

**Problem 1 — `department_id` nulstilles ved opdatering (kritisk)**

I `CarSecurityService.updateCar` (linje 131) er:
```typescript
department_id: (carData as any).department_id || null,
```

`CarFormData`-objektet (der kommer fra formularen) indeholder **ikke** `department_id` — det felt eksisterer ikke i formularens state. Resultatet er at `department_id` altid skrives som `NULL` ved enhver bilredigering. Det er præcis derfor bil 04 (`id: 27a3e350`) nu har `department_id = NULL` og forsvinder fra Michaels liste, fordi `fetchCars` filtrerer på `.eq('department_id', departmentId)`.

Databasedumpen bekræfter: `car_number: 04` i afdeling 14 har `department_id: <nil>`.

**Problem 2 — Ingen frontend-validering af duplikate brændstofkortkoder**

`fuel_card_code` er ikke unique i `public.cars`-tabellen (kun i `demo.cars`), så databasen tillader duplicater. Men selv uden en constraint fejl er brugeroplevelsen forvirrende, da der ikke gives nogen advarsel om at koden allerede bruges af en anden bil.

### Rettelser

#### 1. Data: Ret `department_id` på bil 04 tilbage til afdeling 14

En migration der sætter `department_id` korrekt for den berørte bil:

```sql
UPDATE cars 
SET department_id = '63d46993-31cb-4921-bb3d-5934984ab6b3'
WHERE id = '27a3e350-3a0e-403d-a8b5-51350351bad9'
  AND department_id IS NULL;
```

#### 2. Kode: Bevar `department_id` ved opdatering i `CarSecurityService.updateCar`

**Fil: `src/services/carSecurityService.ts` (linje 131)**

Problemet er at `department_id` tages fra `carData` (formularen), men formularen sender aldrig dette felt med. Løsningen er at hente den eksisterende bil fra databasen FØRST, og bruge dens `department_id` som fallback — så den aldrig overskrives med `NULL`:

```typescript
// I updateData-objektet (linje 131):
department_id: (carData as any).department_id || undefined,
// Ændres til — udelad department_id helt fra update-objektet,
// så databasen beholder den eksisterende værdi:
// (Fjern department_id fra updateData)
```

Den sikreste løsning er at **fjerne `department_id` helt fra `updateData`**. `department_id` skal aldrig ændres ved en bilredigering — den sættes kun ved oprettelse og administreres via admin-interfaces. Derved kan databasefeltet aldrig nulstilles ved en normal redigering.

#### 3. Kode: Frontend-validering af duplikat brændstofkortkode i `CarFormDialog`

Tilføj en advarsel i formularen, hvis den indtastede `fuel_card_code` allerede bruges af en anden bil. Dette sker med et `useEffect`-tjek mod den aktive bilers liste:

```typescript
// I CarFormDialog eller useCarFormState:
// Tjek om fuel_card_code allerede bruges af en anden bil (ikke den bil der redigeres)
const isDuplicateFuelCode = cars.some(
  car => car.fuel_card_code === formData.fuel_card_code 
    && car.fuel_card_code !== '' 
    && car.fuel_card_code !== null
    && car.id !== currentCar?.id
);
// Vis advarsel i UI og disable Gem-knappen
```

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| Database (migration) | Ret `department_id` på bil 04 tilbage til afdeling 14 |
| `src/services/carSecurityService.ts` | Fjern `department_id` fra `updateData` — den overskrives aldrig mere |
| `src/components/Cars/CarFormDialog.tsx` | Tilføj duplikat-advarsel for `fuel_card_code` |
| `CHANGELOG.md` | Dokumenter rettelserne |

### Tekniske detaljer

- `department_id` fjernes **kun fra `updateData`** — ikke fra `insertData`. Nye biler arver stadig `selectedDepartmentId` korrekt via `useCarData.createCar` (linje 139).
- Alle eksisterende biler der er redigeret efter den fejlbehæftede kode bør tjekkes for `department_id = NULL`. Migrationen retter den kendte bil (04). En bredere audit-query vises i CHANGELOG.
- Duplikat-valideringen er client-side og sammenligner kun biler der er synlige i den aktive afdeling — ikke på tværs af afdelinger.

### Kvalitetstjek
- Bil 04 i afdeling 14 er synlig igen efter migration
- Redigering af en bil nulstiller aldrig `department_id`
- Admins advares (med fejlmeddelelse) hvis de forsøger at bruge en brændstofkortkode der allerede er i brug
- `Gem`-knappen i formularen disables ved duplikat brændstofkortkode
