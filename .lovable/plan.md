

## Fix dobbelt-toast + side-opdatering ved feature-toggle + vikar-toggle

### Problem 1: Dobbelt toast ved afdelingsskift

Aarsag: `DepartmentSelector.tsx` bruger en `useEffect` der reagerer paa `selectedDepartment?.id`. Naar `switchDepartment` kaldes, opdateres state med det samme, men `refetchDepartments` (fra `fetchCounter`) trigger ogsaa en genindlaesning af `userDepartments`, som kan udloese effekten to gange.

**Loesning**: Flyt toast-logikken ind i `switchDepartment`-handleren i stedet for `useEffect`, saa den kun koerer een gang ved klik.

**Fil: `src/components/Layout/NavComponents/DepartmentSelector.tsx`**
- Fjern `useEffect` der viser toast
- Opret en lokal `handleSwitch(deptId)` funktion der kalder `switchDepartment(deptId)`, finder det nye afdelingsnavn, og viser toast een gang
- Behold animationslogikken via `useEffect` (kun CSS, ingen toast)

---

### Problem 2: Siden opdateres ikke naar feature toggles aendres

**Fil: `src/components/Admin/FeatureToggleManagement.tsx`**
- Efter succesfuld toggle og `refetchDepartments()`: tilfoej `window.location.reload()` eller brug en React-key-baseret remount for at tvinge UI-opdatering
- Alternativt: brug `navigate(0)` fra react-router for at genindlaese den aktuelle side

---

### Problem 3: Tilfoej vikar-toggle

**Database migration**: Tilfoej `substitute_enabled BOOLEAN NOT NULL DEFAULT true` til `departments`-tabellen.

**Fil: `src/context/DepartmentContext.tsx`**
- Udvid `Department` interface med `substitute_enabled: boolean`
- Hent feltet i alle department-queries
- Tilfoej `isSubstituteEnabled` til context (demo = altid true)

**Fil: `src/components/Admin/FeatureToggleManagement.tsx`**
- Tilfoej tredje Switch-rad for "Vikar" med `substitute_enabled`
- Brug `UserPlus`-ikon fra lucide-react

**Fil: `src/pages/EmployeesPage.tsx`**
- Importer `useDepartment` og brug `isSubstituteEnabled`
- Skjul "Tilfoej Vikar"-knappen naar `isSubstituteEnabled === false`
- Skjul vikar-sektionen i medarbejderlisten

**Fil: `src/components/Admin/UserManagement.tsx`**
- Skjul "Tilfoej Vikar"-knappen naar `isSubstituteEnabled === false`

**Fil: `src/components/Layout/TopNavbar.tsx`**
- Ingen aendring nødvendig (vikar er ikke et menupunkt)

**Fil: `src/translations/da/admin.ts`**
- Tilfoej: `features.substituteEnabled: 'Vikar'`

**Fil: `src/translations/en/admin.ts`**
- Tilfoej: `features.substituteEnabled: 'Substitute'`

---

### Tekniske detaljer

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| Supabase migration | NY | Tilfoej `substitute_enabled` kolonne |
| `src/context/DepartmentContext.tsx` | OPDATER | Tilfoej `substitute_enabled` + `isSubstituteEnabled` |
| `src/components/Layout/NavComponents/DepartmentSelector.tsx` | OPDATER | Fix dobbelt-toast |
| `src/components/Admin/FeatureToggleManagement.tsx` | OPDATER | Tilfoej vikar-toggle + side-reload efter toggle |
| `src/pages/EmployeesPage.tsx` | OPDATER | Skjul vikar-funktioner naar deaktiveret |
| `src/components/Admin/UserManagement.tsx` | OPDATER | Skjul vikar-knap naar deaktiveret |
| `src/translations/da/admin.ts` | OPDATER | Ny oversaettelse |
| `src/translations/en/admin.ts` | OPDATER | Ny oversaettelse |

