## Fix: Afdelingsfiltrering paa biler + dynamiske lokationer paa lager

### Problem 1: Biler vises uden afdelingsfilter

Netvaerksforespoegslen viser `cars?select=*&order=name.asc` uden `department_id`-filter. Det sker fordi `useCarData`-hookens react-query koerer foer `selectedDepartmentId` er sat. Betingelsen `enabled: userDataLoaded && !!user` venter ikke paa afdelingsvalg.

### Problem 2: Lokationer er hardkodet

Lagerformularen viser altid "Hal 1" og "Sort Hal" som faste valgmuligheder. Men `LocationManagement` gemmer dynamiske lokationer i localStorage per afdeling. Formularen og tabellen bruger ikke disse dynamiske data.

---

### Loesning

#### 1. `src/hooks/car/useCarData.ts` — Vent paa afdelingsvalg

Tilfoej `selectedDepartmentId` til queryens `enabled`-betingelse:

```text
// Foer:
enabled: userDataLoaded && !!user,

// Efter:
enabled: userDataLoaded && !!user && (isDemoMode || !!selectedDepartmentId),
```

#### 2. `src/types/warehouse.ts` — Goer hall-typen dynamisk

Aendr `hall`-feltet fra en fast union-type til `string | null`:

```text
// Foer:
hall: 'hal_1' | 'sort_hal' | null;

// Efter:
hall: string | null;
```

Samme i `WarehouseItemFormData`:

```text
// Foer:
hall?: 'hal_1' | 'sort_hal';

// Efter:
hall?: string;
```

#### 3. `src/components/Warehouse/WarehouseFormDialog.tsx` — Brug dynamiske lokationer

- Importer `useDepartment` og laes lokationer fra localStorage med noeglen `location-data-{selectedDepartmentId}`
- Erstat de hardkodede RadioGroup-knapper med en Select-dropdown der viser de dynamiske lokationer
- Tilfoej en "Ingen lokation" mulighed

#### 4. `src/components/Warehouse/WarehouseTableRow.tsx` — Vis dynamisk lokationsnavn

- Laes lokationer fra localStorage og slaa op paa `item.hall` for at finde label
- Erstat det hardkodede `hal_1`/`sort_hal` ternary med dynamisk opslag

#### 5. `src/components/Warehouse/MobileWarehouseCard.tsx` — Samme fix

- Samme dynamiske opslag som i WarehouseTableRow

#### 6. Database-migration

Aendr `hall`-kolonnens CHECK constraint (hvis den eksisterer) eller bekraeft at den allerede er `text` uden restriction. Databasen viser `hall: string | null` saa der er ingen constraint at fjerne.

#### 7. `CHANGELOG.md` — Dokumenter begge rettelser

---

### Filer der aendres


| Fil                                                | Aendring                                                |
| -------------------------------------------------- | ------------------------------------------------------- |
| `src/hooks/car/useCarData.ts`                      | Tilfoej `selectedDepartmentId` til `enabled`-betingelse |
| `src/types/warehouse.ts`                           | Goer `hall` til `string` i stedet for fast union        |
| `src/components/Warehouse/WarehouseFormDialog.tsx` | Dynamiske lokationer fra localStorage                   |
| `src/components/Warehouse/WarehouseTableRow.tsx`   | Dynamisk lokationsnavnopslag                            |
| `src/components/Warehouse/MobileWarehouseCard.tsx` | Dynamisk lokationsnavnopslag                            |
| `CHANGELOG.md`                                     | Dokumenter begge rettelser                              |


### Kvalitetstjek

- Biler hentes kun naar en afdeling er valgt — afdeling 14 ser kun sine egne biler
- Lagerformularen viser kun lokationer oprettet for den aktive afdeling
- Tabellen viser korrekte lokationsnavne baseret paa dynamisk opslag
- Afdelinger uden oprettede lokationer viser en tom liste (ikke hardkodede vaerdier)
- Demo-tilstand paavirkes ikke