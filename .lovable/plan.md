

## Goer fuel_card_code valgfri og ikke-unik

### Problem
`fuel_card_code` er i dag `NOT NULL` med en `UNIQUE (fuel_card_code, department_id)` constraint. Det kraever at feltet udfyldes, og man kan ikke have to biler uden braendstofkort i samme afdeling.

### Loesning

#### 1. Database-migration
- Fjern `unique_fuel_card_code_per_dept` constraint
- Goer `fuel_card_code` nullable med default `NULL`
- Opdater eksisterende AUTO-placeholder-vaerdier til NULL

```text
ALTER TABLE cars DROP CONSTRAINT IF EXISTS unique_fuel_card_code_per_dept;
ALTER TABLE cars ALTER COLUMN fuel_card_code DROP NOT NULL;
ALTER TABLE cars ALTER COLUMN fuel_card_code SET DEFAULT NULL;
UPDATE cars SET fuel_card_code = NULL WHERE fuel_card_code LIKE 'AUTO-%';
```

#### 2. `src/services/carSecurityService.ts`
- Fjern validation der kraever fuel_card_code for administratorer (linje 69-71)
- Forenkl fuel_card_code logik: brug vaerdien hvis den er givet, ellers `null` (linje 90-97)
- Fjern AUTO-placeholder generering

Foer:
```text
if (canViewFuel && !carData.fuel_card_code) {
  throw new Error('Fuel card code is required for administrators');
}
...
insertData.fuel_card_code = `AUTO-${Date.now()}-...`;
```

Efter:
```text
// Ingen validation — feltet er valgfrit
...
insertData.fuel_card_code = carData.fuel_card_code?.trim() || null;
```

#### 3. `src/components/Cars/CarFormDialog.tsx`
- Fjern `required` fra fuel_card_code input (linje 108)

#### 4. `src/types/car.ts` og `src/components/Cars/types.ts`
- Aendr `fuel_card_code: string` til `fuel_card_code: string | null` i begge interfaces

#### 5. `CHANGELOG.md`
- Dokumenter aendringen

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| Database migration | Fjern unique constraint, goer kolonne nullable |
| `src/services/carSecurityService.ts` | Fjern krav og placeholder-logik |
| `src/components/Cars/CarFormDialog.tsx` | Fjern `required` paa fuel_card_code |
| `src/types/car.ts` | `fuel_card_code` nullable |
| `src/components/Cars/types.ts` | `fuel_card_code` nullable |
| `CHANGELOG.md` | Dokumenter aendring |

