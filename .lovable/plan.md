
## Plan: Rolle-badge farver

Mål: Skadeleder=Lilla, Fugttekniker=Blå, Servicemedarbejder=Grøn.

### 1. Tilføj `purple`-variant til `StatusBadge`
`src/components/ui/status-badge.tsx`:
- Udvid `StatusVariant` med `'purple'`.
- Tilføj style: `purple: "bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs px-1.5 py-0.5"`.

### 2. Opdater `getRoleVariant` i to filer
Begge `src/components/Employees/EmployeeTableRow.tsx` (linje 29-40) og `src/components/Employees/MobileEmployeeCard.tsx` (linje 40-47):

```ts
case 'super_admin': return 'warning';        // gul (uændret)
case 'administrator': return 'info';         // blå (uændret)
case 'skadeleder': return 'purple';          // ← ny
case 'fugttekniker': return 'info';          // ← ny, blå
case 'servicemedarbejder': return 'success'; // ← ny, grøn
case 'vikar': return 'default';              // grå (uændret)
default: return 'default';
```

Tilføj også label-cases for `fugttekniker` i `getRoleLabel` begge steder (mangler i dag — viser kun rå streng).

### 3. Oversættelser
Tilføj `fugttekniker` i `src/translations/da/employees.ts` og `en/employees.ts` (bekræft hvor `employees.skadeleder` mv. ligger).

### 4. Changelog
Tilføj entry: "Rolle-badges: Skadeleder=lilla, Fugttekniker=blå, Servicemedarbejder=grøn".

### Bemærk
Administrator-badgen er allerede blå (`info`), så Administrator og Fugttekniker får begge blå farve. Hvis du vil have Administrator i en anden farve (fx orange/rød), så sig til — jeg har holdt den uændret da du kun nævnte tre roller.
