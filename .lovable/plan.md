

## Tre rettelser: Lager demo-persistens, lokationsstyring med CRUD, og rolle-toast oversaettelse

### 1. Lager-redigering gemmes ikke i demo mode

**Problem:** `useWarehouseActions.ts` virtualiserer korrekt (viser success-toast, kalder `onSuccess`), men `onSuccess` kalder kun `refetch()` som henter fra databasen igen. I demo mode hentes data via `get_demo_warehouse_items` RPC, saa den lokale aendring gaar tabt.

**Loesning:** I `useWarehouseData.ts` - tilfoej lokal state-opdatering i demo mode saa aendringer persisterer i hukommelsen.

**Fil: `src/hooks/warehouse/useWarehouseData.ts`** (OPDATER)
- Tilfoej tre nye funktioner: `updateLocalItem`, `deleteLocalItem`, `addLocalItem` der opdaterer `items` state direkte
- Eksporter disse funktioner saa `useWarehouseActions` kan kalde dem i demo mode

**Fil: `src/hooks/warehouse/useWarehouseActions.ts`** (OPDATER)
- I demo mode: kald de lokale state-opdateringsfunktioner i stedet for bare at vise toast
- Modtag `updateLocalItem`/`deleteLocalItem`/`addLocalItem` som parametre (eller via en callback)

**Fil: `src/hooks/warehouse/index.ts`** (OPDATER)
- Forbind de lokale state-funktioner fra `useWarehouseData` til `useWarehouseActions`

### 2. LocationManagement med redigering og sletning

**Problem:** Komponenten er read-only og viser kun en statisk liste. Mangler ogsaa oversaettelser under `admin.locations`.

**Fil: `src/components/Admin/LocationManagement.tsx`** (OPDATER - komplet omskrivning)
- Tilfoej inline-redigering af lokationsnavne (samme moenster som afdelingsstyring)
- Tilfoej slet-knap med bekraeftelsesdialog
- Naar en lokation slettes: vis en AlertDialog der advarer om at alle opbevaringer tilknyttet denne lokation vil faa deres lokation sat til "ingen"
- I demo mode: virtualisere alle aendringer lokalt
- I produktion: opdater via oversaettelserne (da `hall` er en enum i databasen, kan navnene kun aendres via oversaettelser - dette kommunikeres tydeligt)

Bemærk: Da `hall`-feltet er en database-enum (`hal_1` | `sort_hal`), kan man ikke dynamisk tilfoeje/slette lokationer uden en databaseaendring. Implementationen vil:
- Tillade redigering af visningsnavnet (gemt lokalt i session/localStorage)
- Tillade "sletning" som skjuler lokationen og nulstiller tilknyttede items
- I produktion paavirkes warehouse_items tabellen (hall saettes til null)

**Fil: `src/translations/da/admin.ts`** (OPDATER)
- Tilfoej `admin.locations` objekt med:
  - `description`: "Administrer lagerlokationer og deres navne"
  - `editName`: "Rediger navn"
  - `delete`: "Slet lokation"
  - `deleteConfirm`: "Slet lokation?"
  - `deleteWarning`: "Alle opbevaringer tilknyttet denne lokation vil faa deres lokation sat til 'Ingen'. Denne handling kan ikke fortrydes."
  - `deleted`: "Lokation slettet"
  - `renamed`: "Lokationsnavn opdateret"
  - `noLocations`: "Ingen lokationer"

**Fil: `src/translations/en/admin.ts`** (OPDATER)
- Tilfoej tilsvarende engelske oversaettelser for `admin.locations`

### 3. Rolle-skift toast bruger forkerte oversaettelsesnoegler

**Problem:** `AuthContext.tsx` linje 631-632 bruger `t('auth.roleChanged')` og `t('auth.roleChangedTo')`, men disse noegler findes ikke i `auth.ts`. De findes i `common.ts` som `common.roleChanged`.

**Fil: `src/context/AuthContext.tsx`** (OPDATER)
- Linje 631: AEndr `t('auth.roleChanged')` til `t('common.roleChanged')`
- Linje 632: AEndr `t('auth.roleChangedTo', { role })` til en korrekt oversaettelse

**Fil: `src/translations/da/common.ts`** (OPDATER)
- Tilfoej `roleChangedTo`: "Skiftet til {role}" (hvis den ikke allerede findes)

**Fil: `src/translations/en/common.ts`** (OPDATER)
- Tilfoej `roleChangedTo`: "Switched to {role}" (hvis den ikke allerede findes)

Desuden: i description skal rollenavnet oversaettes til det laesbare navn (f.eks. "Super Admin" i stedet for "super_admin"). Dette kraever at AuthContext slaar rolle-labelet op via `t('admin.roles.' + role)`.

---

### Tekniske detaljer

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| `src/hooks/warehouse/useWarehouseData.ts` | OPDATER | Tilfoej lokale state-opdateringsfunktioner for demo |
| `src/hooks/warehouse/useWarehouseActions.ts` | OPDATER | Brug lokale funktioner i demo mode |
| `src/hooks/warehouse/index.ts` | OPDATER | Forbind data og actions hooks |
| `src/components/Admin/LocationManagement.tsx` | OPDATER | Fuld CRUD med inline-redigering og slet med advarsel |
| `src/translations/da/admin.ts` | OPDATER | Tilfoej `admin.locations` oversaettelser |
| `src/translations/en/admin.ts` | OPDATER | Tilfoej engelske `admin.locations` oversaettelser |
| `src/context/AuthContext.tsx` | OPDATER | Ret oversaettelsesnoegler for rolle-toast |
| `src/translations/da/common.ts` | OPDATER | Tilfoej `roleChangedTo` hvis mangler |
| `src/translations/en/common.ts` | OPDATER | Tilfoej `roleChangedTo` hvis mangler |

