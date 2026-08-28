# Søgning og filtrering i Lager + manglende oversættelse

## Mål
1. Gøre det muligt at søge i lagerlisten (adresse, sagsnummer, noter) i stedet for at scrolle hele listen igennem.
2. Tilføje en filterfunktion, så man fx kan filtrere på Lokation (hal) og "Er rengjort?"-status.
3. Fikse manglende oversættelse af `warehouse.description` (nøglen findes ikke i hverken da eller en, så siden viser nøglen/tom tekst).

## Ændringer

### 1. `src/pages/WarehousePage.tsx`
- Tilføj lokal state: `searchQuery`, `hallFilter`, `cleanedFilter`.
- Brug den eksisterende `SegmentedFilterBar`-komponent (`src/components/shared/SegmentedFilterBar.tsx`) med søgefelt + segmenter for "Rengjort"-status (Alle / Ja / Nej / Ikke nødvendigt) — matcher designet på øvrige listesider.
- Tilføj et lokation-filter (Select/dropdown) med de tilgængelige lokationer via `useLocations` (eller unikke `hall`-værdier fra items), placeret som `trailing` i filterbaren.
- Filtrér `items` client-side før de sendes til `WarehouseList`:
  - Søgning: match mod `address`, `case_number`, `notes` (case-insensitiv).
  - Hall-filter og cleaned-filter kombineres med søgningen.
- EmptyState vises når filteret giver 0 resultater (med passende tekst).

### 2. Oversættelser
Tilføj manglende nøgler i `src/translations/da/warehouse.ts` og `src/translations/en/warehouse.ts`:
- `description` (fx "Oversigt over opbevarede effekter" / "Overview of stored items")
- `searchPlaceholder`, filter-labels (Alle / Rengjort-status / Lokation) og evt. "ingen resultater"-tekst.

## Teknisk
- Ingen databaseændringer — alt foregår client-side.
- Følger eksisterende design (SegmentedFilterBar bruges allerede andre steder i projektet).
- Efterfølgende: opdater `CHANGELOG.md` og marker relevante opgaver i `docs/implementation-plan/tasks.md` jf. projektrutiner.
