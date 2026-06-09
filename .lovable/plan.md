# Plan: VW Vejhjælp + Hjælpekøretøj-flag

## 1. VW Vejhjælp-knap

Ved siden af "Falck Vejhjælp" på Biler-siden tilføjes en ny knap "VW Vejhjælp".

- Ny komponent `src/components/Cars/VWAssistanceButton.tsx` (kopi af `FalckSubscriptionButton`, men uden abonnementsnummer-sektion).
- Indhold i dialog: kun vagttelefon `80 20 30 80` (klikbar `tel:80203080`).
- Indsættes i `src/pages/CarsPage.tsx` lige efter `<FalckSubscriptionButton />`.
- Oversættelser tilføjes til `src/translations/da/cars.ts` og `en/cars.ts`:
  - `vwAssistance: "VW Vejhjælp"`
  - `vwPhoneLabel: "Vagttelefon"` / `"Emergency Phone"`
  - `vwPhoneNumber: "80 20 30 80"`

## 2. Nyt felt: hjælpekøretøj (trailere, miljøvogne m.m.)

I dag findes `show_in_planner`. Det skjuler bilen alle steder i planlæggeren — også fra valglisten på opgaver. Det passer ikke til ønsket: trailere/miljøvogne **skal** kunne vælges til sager, men ikke optræde under "Tilgængelige biler".

Derfor introduceres et nyt boolesk felt `is_auxiliary` på `cars` (default `false`).

### Adfærd når `is_auxiliary = true`

| Sted | Adfærd |
|---|---|
| Biler-side (liste/tabel) | Vises som normalt, med en lille badge "Hjælpekøretøj" |
| Opgavedialog / MultipleCarSelector / BulkAssignCar | Kan vælges (uændret) |
| Planner → "Ikke-tildelte ressourcer" → Tilgængelige biler | **Skjules** |
| Dashboard-metric "Tilgængelige biler" | **Tælles ikke med** (hverken i tæller eller nævner) |

### Tekniske ændringer

- **DB-migration:** `ALTER TABLE public.cars ADD COLUMN is_auxiliary boolean NOT NULL DEFAULT false;`
- **Typer:** tilføj `is_auxiliary?: boolean` i `src/types/car.ts` og `src/components/Cars/types.ts`.
- **CarFormDialog:** nyt checkbox-felt "Hjælpekøretøj (trailer/miljøvogn)" lige under `show_in_planner`. Hjælpetekst forklarer at det skjuler bilen fra tilgængelige-pool, men beholder den valgbar på opgaver.
- **`useCarFormState`:** medtag `is_auxiliary` i payload til insert/update.
- **`src/components/Planner/UnassignedResourcesSection.tsx`** (linje ~167): tilføj filter `if (car.is_auxiliary) return false;`.
- **`src/hooks/useDashboardMetrics.ts`** (linje ~84-118): ekskludér `is_auxiliary` biler i både total og available-tælling for "tilgængelige biler"-metric.
- **CarsList/Tabel:** vis badge "Hjælpe" når `is_auxiliary` er sat (subtil, `variant="secondary"`).
- **Oversættelser:** `cars.isAuxiliary`, `cars.isAuxiliaryHint`, `cars.auxiliaryBadge` (da + en).

## 3. Dokumentation

- `CHANGELOG.md`: log de to ændringer.
- `docs/implementation-plan/tasks.md`: marker som `[x]` hvis en relateret opgave findes, ellers tilføj punktet.

## Filer der oprettes/ændres

```text
+ src/components/Cars/VWAssistanceButton.tsx
~ src/pages/CarsPage.tsx
~ src/components/Cars/CarFormDialog.tsx
~ src/components/Cars/CarsList.tsx (+ tabel/mobilkort for badge)
~ src/components/Cars/types.ts
~ src/types/car.ts
~ src/hooks/car/useCarFormState.ts
~ src/components/Planner/UnassignedResourcesSection.tsx
~ src/hooks/useDashboardMetrics.ts
~ src/translations/da/cars.ts
~ src/translations/en/cars.ts
~ CHANGELOG.md
~ docs/implementation-plan/tasks.md
+ supabase migration (ny kolonne)
```

## Åbne spørgsmål

1. Skal eksisterende biler med `show_in_planner = false` automatisk migreres til `is_auxiliary = true`? (Standard: nej — `show_in_planner` bibeholdes som separat skjul-funktion.)
2. Skal badget "Hjælpekøretøj" også vises i planner-valglisten, så brugeren tydeligt ser at det er en trailer/miljøvogn? (Anbefaling: ja.)
