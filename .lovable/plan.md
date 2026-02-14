

## Rettelser og Forbedringer

### Problem 1: Super Admin label vises som "super_admin" i medarbejderlisten

Både `EmployeeTableRow.tsx` og `MobileEmployeeCard.tsx` har en `getRoleLabel` funktion der ikke haandterer `super_admin`-casen. Den falder igennem til `default: return role`, som returnerer den raa streng "super_admin".

**Filer:**
- `src/components/Employees/EmployeeTableRow.tsx` (linje 41-54)
- `src/components/Employees/MobileEmployeeCard.tsx` (linje 29-37)

**AEndring:** Tilfoej `case 'super_admin': return t('employees.super_admin');` i begge `getRoleLabel` funktioner. Tilfoej ogsaa en passende variant i `getRoleVariant` (f.eks. `'warning'` eller `'info'`).

---

### Problem 2: Super Admin skal kunne se alle afdelinger i brugerstyring-filteret

I `UserManagement.tsx` (linje 800-814) viser afdelingsfilter-dropdown kun den aktuelt valgte afdeling og "Ikke-tildelte". Super Admin skal kunne vaelge enhver afdeling direkte fra denne dropdown uden at skifte i headeren.

**Fil:** `src/components/Admin/UserManagement.tsx` (linje 800-814)

**AEndring:** Udvid Select-dropdown til at vise alle afdelinger som valgmuligheder (for Super Admin og Admin). AEndr `departmentFilter` state fra `'current' | 'unassigned'` til at kunne holde et specifikt department-id eller `'unassigned'`. Opdater `filteredUsers` logikken tilsvarende.

---

### Problem 3: Underafdelinger skal fungere som primaer arbejdskontekst

Naar der er underafdelinger, skal brugeren vaere i en underafdeling - ikke hovedafdelingen. Header-selectoren skal altid vise underafdelings-dropdown naar der findes underafdelinger, ogsaa naar der kun er 1 underafdeling (i dag vises den kun ved `> 1`).

**Fil:** `src/components/Layout/NavComponents/DepartmentSelector.tsx` (linje 67 og 112)

**AEndring:** AEndr betingelsen fra `userSubDepartments.length > 1` til `userSubDepartments.length > 0`. Naar der er praecis 1 underafdeling, vises den som et statisk label (ikke dropdown). Naar der er flere, vises dropdown som nu.

---

### Tekniske detaljer

#### EmployeeTableRow.tsx og MobileEmployeeCard.tsx - getRoleLabel:
```tsx
// Tilfoej foer 'administrator' case:
case 'super_admin':
  return t('employees.super_admin');
```

#### UserManagement.tsx - Afdelingsfilter:
```tsx
// State aendring:
const [departmentFilter, setDepartmentFilter] = useState<string>('current');

// filteredUsers logik:
if (departmentFilter === 'unassigned') { ... }
else if (departmentFilter !== 'current') {
  // Specifikt department_id valgt
  const usersInDept = new Set(
    userAccessData.filter(ua => ua.department_id === departmentFilter).map(ua => ua.user_id)
  );
  return baseUsers.filter(u => usersInDept.has(u.id));
}
else { ... eksisterende logik med selectedDepartmentId ... }

// Dropdown viser alle afdelinger:
<SelectContent>
  <SelectItem value="current">{currentDeptName}</SelectItem>
  {departments.filter(d => d.id !== selectedDepartmentId).map(d => (
    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
  ))}
  {canSeeUnassigned && <SelectItem value="unassigned">...</SelectItem>}
</SelectContent>
```

#### DepartmentSelector.tsx - Vis underafdelinger altid:
```tsx
// AEndr fra:
{userSubDepartments.length > 1 && <SubDepartmentDropdown ... />}
// Til:
{userSubDepartments.length === 1 && (
  <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground">
    <Layers className="h-4 w-4" />
    <span>{userSubDepartments[0].name}</span>
  </div>
)}
{userSubDepartments.length > 1 && <SubDepartmentDropdown ... />}
```

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/Employees/EmployeeTableRow.tsx` | Tilfoej `super_admin` case i getRoleLabel og getRoleVariant |
| `src/components/Employees/MobileEmployeeCard.tsx` | Tilfoej `super_admin` case i getRoleLabel og getRoleVariant |
| `src/components/Admin/UserManagement.tsx` | Udvid afdelingsfilter til at vise alle afdelinger |
| `src/components/Layout/NavComponents/DepartmentSelector.tsx` | Vis underafdelinger ogsaa naar der kun er 1 |

