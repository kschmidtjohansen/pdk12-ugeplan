

## Kombineret plan: Login afdelingsvisning + Lager autocomplete + Gray-farver

### Del 1: Login-side - Fix afdelingsvisning (FEJL FUNDET)

**Rodaarsag**: Paa login-siden er brugeren IKKE autentificeret. RLS-politikkerne paa `departments`-tabellen blokerer derfor Supabase-queryen `supabase.from('departments').select('name')`, som returnerer `null`. Derfor vises altid fallback-teksten "Internt planlægningssystem".

**Loesning**: Gem afdelingsnavnet direkte i `localStorage` naar brugeren skifter afdeling, saa login-siden kan laese det uden en database-query.

**Aendringer**:

1. **`src/context/DepartmentContext.tsx`** (2 steder):
   - I `setSelectedDepartmentId` (linje 282-289): Naar et ID gemmes, find ogsaa afdelingsnavnet og gem det i `localStorage` som `selected_department_name`
   - I `switchDepartment` (linje 303-308): Samme logik - gem ogsaa navnet

2. **`src/pages/LoginPage.tsx`**:
   - Fjern hele `useEffect` der laver Supabase-query (linje 20-28)
   - Fjern `supabase` import (linje 6)
   - Laes i stedet direkte fra `localStorage.getItem('selected_department_name')`
   - Erstat hardcoded gray-farver med semantiske tokens:
     - `bg-gray-50` -> `bg-muted/50`
     - `text-gray-900` -> `text-foreground`
     - `text-gray-600` -> `text-muted-foreground`

---

### Del 2: Lager adresse-autocomplete

**Aendringer i `src/components/Warehouse/WarehouseFormDialog.tsx`**:

1. Importer `AddressAutocomplete` fra `@/components/Planner/AddressAutocomplete`
2. Erstat det almindelige `<Input>` for adresse med `AddressAutocomplete`-komponenten
3. Brug `watch('address')` og `setValue('address', ...)` til at styre vaerdien

---

### Del 3: Dokumentation

**`CHANGELOG.md`**: Dokumenter begge rettelser.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/context/DepartmentContext.tsx` | Gem afdelingsnavn i localStorage ved skift |
| `src/pages/LoginPage.tsx` | Laes navn fra localStorage i stedet for DB-query + gray-farver |
| `src/components/Warehouse/WarehouseFormDialog.tsx` | Erstat Input med AddressAutocomplete |
| `CHANGELOG.md` | Dokumenter aendringerne |

### Kvalitetstjek
- Login-side viser f.eks. "12 - Fredericia" naar localStorage har gemt afdeling
- Login-side viser "Internt planlægningssystem" naar ingen afdeling er gemt (foerste login)
- Ingen Supabase-kald paa login-siden (undgaar RLS-blokering)
- Alle farver bruger semantiske tokens
- Lager autocomplete fungerer paa mobil
- Ingen console.log uden DEV-guard
