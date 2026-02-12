

## Plan: Optimistic UI opdateringer

### Analyse

Optimistic UI giver mening hvor:
1. Handlingen har direkte lokal state (`setCars`, `setItems`)
2. Rollback er simpel (gem tidligere state, gendant ved fejl)
3. Brugeren faar ojeblikkelig feedback

### Hooks der faar optimistic updates

| Hook | Handling | Nuvaerende adfaerd | Optimistic aendring |
|------|----------|-------------------|---------------------|
| `useCarActions` | Toggle tilgaengelighed | DB kald -> derefter setCars | setCars foerst -> DB kald -> rollback ved fejl |
| `useCarActions` | Slet bil | DB kald -> derefter setCars | setCars foerst -> DB kald -> rollback ved fejl |
| `useWarehouseActions` | Opret/opdater/slet | DB kald -> derefter onSuccess callback | Kald local handlers foerst -> DB kald -> rollback ved fejl |
| `useEmployeeActions` | Toggle fravaar | DB kald -> derefter refreshEmployees | Ikke kandidat (kræver fuld refetch pga. kompleks data) |

**Fravalgt:**
- `useAssignmentActions`: For kompleks (multi-date, employee linking, validering). Risiko for inkonsistent state er for hoej.
- `useVacationActions`: Kræver server-genererede felter (id, timestamps) og security logging foer UI-opdatering.
- `useDutyActions`: Ingen lokal state - bruger kun `onSuccess` callback til refetch.
- `useEmployeeActions`: Data-modellen er for kompleks med roller, certifikater og cross-table relationer.

### Tekniske detaljer

**1. `src/hooks/car/useCarActions.ts` - Toggle tilgaengelighed**

I `updateAvailabilityStatus` (linje 252-342):
- Gem snapshot: `const previousCars = [...cars]`
- Opdater UI med det samme: `setCars(cars.map(c => c.id === car.id ? { ...c, is_available: isAvailable, notes } : c))`
- Udfoesr DB-kald
- Ved fejl: `setCars(previousCars)` + vis error toast
- Succes-logik (toast-beskeder) forbliver uaendret

**2. `src/hooks/car/useCarActions.ts` - Slet bil**

I `confirmDelete` (linje 32-215), kun for den simple delete-path (ikke forceDelete):
- Gem snapshot: `const previousCars = [...cars]`
- Fjern bilen fra UI med det samme: `setCars(cars.filter(c => c.id !== currentCar.id))`
- Udfoesr DB-kald
- Ved fejl: `setCars(previousCars)` + vis error toast
- ForceDelete-logikken forbliver uaendret (for kompleks til optimistic)

**3. `src/hooks/warehouse/useWarehouseActions.ts` - Opret/opdater/slet**

For alle tre operationer:
- Modtag `items` og `setItems` som nye parametre (fra useWarehouseData)
- **createItem**: Opret temp item med `crypto.randomUUID()`, tilfoej til state, DB insert, ved fejl fjern temp item
- **updateItem**: Gem snapshot af item, opdater i state, DB update, ved fejl gendant snapshot
- **deleteItem**: Gem snapshot, fjern fra state, DB delete, ved fejl gendant

**4. Sortering bevares**

- Car-listen er ikke sorteret i state (sorteres i UI-komponent) - ingen aendring noevendigt
- Warehouse items sorteres by `created_at desc` - nye items tilfoekjes i starten af listen (`[newItem, ...prev]`)
- Ingen aendring i sorteringslogik

**5. Ingen side-refreshes**

- Alle rollbacks bruger `setCars`/`setItems` direkte - ingen `window.location.reload()` eller `refetch()` ved fejl
- Ved succes beholdes den optimistiske state (DB-data matcher allerede)

### Sikkerhedsgarantier

- ID-generering: Warehouse bruger `crypto.randomUUID()` som allerede eksisterer i koden (linje 55 i useWarehouseData). Ingen aendring i ID-format
- Timestamps: Bruger `new Date().toISOString()` som allerede eksisterer. Ingen aendring
- Succes-logik: Toast-beskeder og callbacks forbliver identiske
- Console.log: Alle eksisterende logs bevares, nye `[Optimistic]` prefix logs tilfoekjes
- Demo mode: Eksisterende demo-logik er allerede optimistisk - forbliver uaendret

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/hooks/car/useCarActions.ts` | Optimistic toggle + delete med rollback |
| `src/hooks/warehouse/useWarehouseActions.ts` | Optimistic create/update/delete med rollback |

