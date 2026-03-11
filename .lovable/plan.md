

## Plan: Flyt lokationer fra localStorage til database

### Problem
Lokationer gemmes i `localStorage`, som er browser-lokalt. Hvis admin opretter lokationer i én browser, kan andre brugere (eller samme bruger på anden enhed) ikke se dem. Det er derfor lokationsvalget er tomt i lagerformularen.

### Løsning
Brug den eksisterende `department_settings`-tabel til at gemme lokationer per afdeling med `setting_key = 'locations'` og `setting_value` som JSON-array.

### Ændringer

#### 1. Ny shared hook: `src/hooks/warehouse/useLocations.ts`
- Henter lokationer fra `department_settings` hvor `setting_key = 'locations'` og `department_id` matcher
- Returnerer `{ locations, loading }` med den parsede JSON-array
- Bruges af alle komponenter der behøver lokationsdata

#### 2. `src/components/Admin/LocationManagement.tsx`
- Erstat localStorage read/write med Supabase queries mod `department_settings`
- `saveLocations()` → upsert til `department_settings` med `setting_key = 'locations'`
- `useEffect` load → select fra `department_settings`
- Behold samme UI og funktionalitet

#### 3. `src/components/Warehouse/WarehouseFormDialog.tsx`
- Erstat `useLocations` (localStorage) med den nye shared hook
- Dropdown viser nu lokationer fra databasen

#### 4. `src/components/Warehouse/WarehouseTableRow.tsx`
- Erstat `useLocationLabel` (localStorage) med den nye shared hook

#### 5. `src/components/Warehouse/MobileWarehouseCard.tsx`
- Erstat `useLocationLabel` (localStorage) med den nye shared hook

#### 6. `src/context/AuthContext.tsx`
- Fjern `location-data-` cleanup fra logout (ikke længere nødvendigt)

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/hooks/warehouse/useLocations.ts` | **Ny** — shared hook til at hente lokationer fra DB |
| `src/components/Admin/LocationManagement.tsx` | Erstat localStorage med Supabase |
| `src/components/Warehouse/WarehouseFormDialog.tsx` | Brug ny hook |
| `src/components/Warehouse/WarehouseTableRow.tsx` | Brug ny hook |
| `src/components/Warehouse/MobileWarehouseCard.tsx` | Brug ny hook |
| `src/context/AuthContext.tsx` | Fjern localStorage cleanup for lokationer |

Ingen database-migrering nødvendig — `department_settings`-tabellen eksisterer allerede med passende RLS-policies.

