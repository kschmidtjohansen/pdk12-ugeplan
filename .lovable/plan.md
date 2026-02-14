

## Ændringer

### 1. UserFormDialog: Flere hovedafdelinger med underafdelinger

**Fil:** `src/components/Admin/UserFormDialog.tsx`

Nuværende adfærd: Kun én hovedafdeling kan vælges (Select dropdown).

Ny adfærd:
- Erstat Select-dropdown for hovedafdeling med **checkboxes** (som underafdelinger allerede bruger), så man kan vælge flere hovedafdelinger
- For hver valgt hovedafdeling vises dens underafdelinger som indrykkede checkboxes
- State ændres fra `selectedDeptId: string` til `selectedDeptIds: string[]` og `selectedSubDeptIds` bliver et map: `Record<string, string[]>` (department_id -> sub_department_id[])

**Load eksisterende data (redigering):**
- Hent alle `user_access`-rækker og grupper dem pr. department_id

**Gem (saveUserAccess):**
- Slet alle eksisterende user_access-rækker for brugeren
- Indsæt nye rækker: for hver valgt hovedafdeling, enten med underafdelinger eller kun hovedafdeling
- Opdater `home_department_id` til den første valgte afdeling

### 2. DepartmentSelector: Tilføj underafdelingsvalg i headeren

**Fil:** `src/components/Layout/NavComponents/DepartmentSelector.tsx`  
**Fil:** `src/context/DepartmentContext.tsx`

Tilføj mulighed for at skifte underafdeling i headeren:

- **DepartmentContext**: Tilføj `selectedSubDepartmentId`, `setSelectedSubDepartmentId`, `userSubDepartments` (underafdelinger for den valgte hovedafdeling)
- Når hovedafdeling skiftes, hentes underafdelinger automatisk og den første vælges som default
- Gemmes i `localStorage` som `selected_sub_department_id`

- **DepartmentSelector**: Vis en ekstra dropdown til højre for hovedafdelings-dropdown, men kun når der findes underafdelinger for den valgte hovedafdeling. Viser underafdelingsnavnet.

### 3. Oversættelser

**Filer:** `src/translations/da/admin.ts` og `src/translations/en/admin.ts`

Tilføj labels for:
- `admin.userManagement.departments` (flertal: "Hovedafdelinger")
- `admin.userManagement.selectDepartments` ("Vælg hovedafdelinger")

---

### Tekniske detaljer

#### UserFormDialog state-ændring:
```
// Fra:
selectedDeptId: string
selectedSubDeptIds: string[]

// Til:
selectedDeptIds: string[]
selectedSubDeptMap: Record<string, string[]>  // deptId -> subDeptIds[]
allSubDepartments: Record<string, SubDepartment[]>  // deptId -> subs
```

#### DepartmentContext tilføjelser:
```
selectedSubDepartmentId: string | null
setSelectedSubDepartmentId: (id: string | null) => void
userSubDepartments: { id: string; name: string }[]
```

#### Underafdelinger hentes via:
```sql
SELECT id, name FROM sub_departments 
WHERE department_id = :selectedDepartmentId 
ORDER BY name
```

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Admin/UserFormDialog.tsx` | Multi-afdeling med checkboxes + underafdelinger pr. afdeling |
| `src/context/DepartmentContext.tsx` | Tilføj underafdelingsvalg (selectedSubDepartmentId, userSubDepartments) |
| `src/components/Layout/NavComponents/DepartmentSelector.tsx` | Vis underafdelings-dropdown når relevant |
| `src/translations/da/admin.ts` | Nye labels |
| `src/translations/en/admin.ts` | Nye labels |

