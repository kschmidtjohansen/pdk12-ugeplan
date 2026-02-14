

## Aendringer (tilfoejelse til eksisterende plan)

### 3. Skjul "Mine Opgaver" naar super admin ser en afdeling de ikke er tilknyttet

**Problem:** Naar en super admin skifter til en afdeling de ikke personligt er tilknyttet via `user_access`, viser "Mine Opgaver" stadig data -- men navne paa biler, medarbejdere m.m. kan vaere forkerte, da de refererer til en anden afdelings data.

**Loesning:**

**Fil 1: `src/context/DepartmentContext.tsx`**
- Tilfoej en ny state `userOwnDepartmentIds` (Set af department_id'er fra `user_access` for den aktuelle bruger)
- For super_admins: hent BAADE alle afdelinger (til dropdown) OG brugerens egne tilknytninger fra `user_access`
- Eksporter en ny beregnet vaerdi `isUserInSelectedDepartment`: `true` hvis `selectedDepartmentId` er i brugerens egne afdelinger, eller hvis brugeren ikke er super_admin
- For ikke-super_admins returnerer den altid `true` (de kan kun se deres egne afdelinger)

**Fil 2: `src/pages/DashboardPage.tsx`**
- Importer `useDepartment` og laes `isUserInSelectedDepartment`
- Betingelse for MineOpgaver: `{isUserInSelectedDepartment && <MineOpgaver />}`
- Ingen andre aendringer til dashboardet

### Filer der aendres

| Fil | Aendring |
|-----|----------|
| `src/context/DepartmentContext.tsx` | Tilfoej `userOwnDepartmentIds` state + `isUserInSelectedDepartment` |
| `src/pages/DashboardPage.tsx` | Betinget rendering af MineOpgaver |

### Sikkerhed
- Ingen database-aendringer
- Ingen UI-elementer fjernes permanent -- de skjules kun kontekstuelt
- Alle andre roller paavirkes ikke

