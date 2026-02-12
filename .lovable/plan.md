

## Fire rettelser: Super Admin i demo, mobil-layout, brugerstyring-actions og demo-opdateringsfejl

### 1. Tilfoej Super Admin rolle i DemoRoleSwitcher

**Fil: `src/components/Demo/DemoRoleSwitcher.tsx`**
- Tilfoej `super_admin` som foerste element i `roles`-arrayet med label "Super Admin" og beskrivelse

### 2. Fix mobil-layout af DemoDashboard-baren

**Fil: `src/components/Demo/DemoDashboard.tsx`**
- AEndr layoutet fra en enkelt horizontal raekke til at wrappe paa mobil:
  - Brug `flex-col sm:flex-row` og `flex-wrap gap-2` saa elementerne stacker paa smaa skaerme
  - Sikrer at "Ryd demo data"-knappen og DemoRoleSwitcher er synlige uden horizontal scroll

### 3. Fix actions i Brugerstyring paa mobil

Problemet er kun paa mobil - action-knapperne (4 stk) klippes eller er umulige at naa paa smaa skaerme.

**Fil: `src/components/Admin/UserTableRow.tsx`**
- Paa mobil (under md): erstat de individuelle ikon-knapper med en enkelt DropdownMenu ("..."-knap) der indeholder alle fire actions (aktivere/deaktivere, nulstil adgangskode, rediger, slet)
- Paa desktop (md og op): behold de eksisterende ikon-knapper som de er
- Brug `useIsMobile()` hook til at skifte mellem de to visninger

**Fil: `src/components/Admin/UserTable.tsx`**
- Fjern `overflow-hidden` fra tabel-containeren saa indholdet ikke klippes

### 4. Fix employees.Update fejl i demo mode

Problemet: Betingelsen `employee.id.startsWith('demo-') || (employee as any).isDemoData` fanger ikke rigtige medarbejdere i demo mode. Naar man redigerer en rigtig medarbejder i demo mode, forsoeges en reel database-opdatering som fejler.

**Fil: `src/hooks/employee/useEmployeeActions.ts`**
- I alle tre funktioner (`toggleEmployeeLeave`, `updateEmployee`, `deleteEmployee`): AEndr betingelsen fra:
  ```
  if (isDemoMode && (employee.id.startsWith('demo-') || (employee as any).isDemoData))
  ```
  til simpelthen:
  ```
  if (isDemoMode)
  ```
- Naar man er i demo mode skal ALLE medarbejder-aendringer virtualiseres lokalt, uanset om medarbejderen er fra demo-data eller ej

---

### Tekniske detaljer

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| `src/components/Demo/DemoRoleSwitcher.tsx` | OPDATER | Tilfoej super_admin til roles array |
| `src/components/Demo/DemoDashboard.tsx` | OPDATER | Responsive layout med flex-col/flex-wrap |
| `src/components/Admin/UserTable.tsx` | OPDATER | Fjern overflow-hidden |
| `src/components/Admin/UserTableRow.tsx` | OPDATER | DropdownMenu paa mobil, ikon-knapper paa desktop |
| `src/hooks/employee/useEmployeeActions.ts` | OPDATER | Virtualiser alle aendringer i demo mode |

