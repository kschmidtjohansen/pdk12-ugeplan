

## Samlet plan: 6 rettelser

### 1. Rolle-labels (RLS + TypeScript type-cast)

**Rodaarsag:** RLS-policyen paa `user_roles`-tabellen tillader kun `administrator` og `skadeleder` at se alle brugeres roller - `super_admin` er IKKE inkluderet. Naar en Super Admin henter medarbejderlisten, returnerer queryen kun deres egen rolle. Alle andre falder til default `'servicemedarbejder'` i koden.

**Aendringer:**
- **SQL migration:** Opdater `user_roles_select_policy` til at inkludere `super_admin`
- **`src/hooks/employee/useEmployeeData.ts`:** Ret type-cast paa linje 49, 68 og 116 fra `as 'administrator' | 'skadeleder' | 'servicemedarbejder'` til `as Employee['role']` saa alle roller (inkl. `super_admin` og `vikar`) haandteres korrekt

---

### 2. Underafdelings-selector placering

**Problem:** Underafdelings-dropdown vises som et separat element der skubber ind i navigationsomraadet.

**Loesning:** Integrer underafdelingen direkte i afdelingsknappen med en breadcrumb-stil separator: "Afd. 02 / Fugt & Skimmel". Klik paa foerste del skifter afdeling, klik paa anden del (eller hele knappen ved kun 1 underafdeling) skifter underafdeling. Alt forbliver kompakt i venstre side.

**Fil:** `src/components/Layout/NavComponents/DepartmentSelector.tsx`

---

### 3. Opgaver filtreres paa underafdeling

**Problem:** `sub_department_id` kolonnen eksisterer allerede i `assignments`-tabellen, men bruges hverken ved oprettelse eller filtrering.

**Aendringer:**
- **`src/hooks/useOptimizedAssignments.ts`:** Tilfoej `selectedSubDepartmentId` fra `useDepartment()` og send det med i `createAssignment` som `sub_department_id`. Tilfoej det ogsaa som dependency i `fetchAssignments`.
- **`src/services/optimizedAssignmentService.ts`:** Send `sub_department_id` med i insert-payload og videregiv til RPC-kaldet.
- **SQL migration:** Opdater `list_accessible_assignments_with_team` til at acceptere `p_sub_department_id` parameter og filtrere paa den.

---

### 4. Tydelig markering ved skift af underafdeling

**Aendringer:**
- **`src/components/Layout/NavComponents/DepartmentSelector.tsx`:** Tilfoej animation (ring-effekt + fade-in) naar underafdeling skiftes, ligesom hovedafdelingen allerede har.
- **`src/context/DepartmentContext.tsx`:** I `setSelectedSubDepartmentId` - kald `unifiedDataService.clearCache()` og invalidate relevante queries saa data genindlaeses.

---

### 5. Biler tilknyttes underafdelinger

**Problem:** `cars`-tabellen har kun `department_id`, ikke `sub_department_id`.

**Aendringer:**
- **SQL migration:** `ALTER TABLE public.cars ADD COLUMN sub_department_id uuid REFERENCES public.sub_departments(id) ON DELETE SET NULL;`
- **`src/types/car.ts` og `src/components/Cars/types.ts`:** Tilfoej `sub_department_id?: string | null`
- **`src/services/carSecurityService.ts`:** Filtrer paa `sub_department_id` naar den er sat
- **`src/hooks/car/useCarData.ts`:** Send `selectedSubDepartmentId` med i queryKey og til fetchCars/createCar
- **`src/components/Cars/CarFormDialog.tsx`:** Tilfoej underafdelings-vaelger i formularen (kun synlig naar der er underafdelinger)

---

### 6. Materiel (warehouse) tilknyttes underafdelinger

**Problem:** `warehouse_items`-tabellen har kun `department_id`, ikke `sub_department_id`.

**Aendringer:**
- **SQL migration:** `ALTER TABLE public.warehouse_items ADD COLUMN sub_department_id uuid REFERENCES public.sub_departments(id) ON DELETE SET NULL;`
- **`src/types/warehouse.ts`:** Tilfoej `sub_department_id?: string | null`
- **`src/hooks/warehouse/useWarehouseData.ts`:** Filtrer paa `selectedSubDepartmentId`
- **`src/components/Warehouse/WarehouseFormDialog.tsx`:** Send `sub_department_id` med ved oprettelse

---

### Tekniske detaljer

#### SQL Migration (samlet):

```sql
-- 1. Fix user_roles RLS for super_admin
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (SELECT get_current_user_role()) = ANY (
    ARRAY['super_admin'::user_role, 'administrator'::user_role, 'skadeleder'::user_role]
  )
  OR (SELECT auth.role()) = 'service_role'::text
);

-- 2. Add sub_department_id to cars
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS sub_department_id uuid REFERENCES public.sub_departments(id) ON DELETE SET NULL;

-- 3. Add sub_department_id to warehouse_items
ALTER TABLE public.warehouse_items
ADD COLUMN IF NOT EXISTS sub_department_id uuid REFERENCES public.sub_departments(id) ON DELETE SET NULL;

-- 4. Update RPC to filter on sub_department_id
CREATE OR REPLACE FUNCTION list_accessible_assignments_with_team(
  p_department_id uuid DEFAULT NULL,
  p_sub_department_id uuid DEFAULT NULL
) ...
-- Add WHERE clause: AND (p_sub_department_id IS NULL OR a.sub_department_id = p_sub_department_id)
```

#### useOptimizedAssignments.ts - sub_department_id:
```tsx
const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();

// I createAssignment:
department_id: selectedDepartmentId || null,
sub_department_id: selectedSubDepartmentId || null,

// I fetchAssignments:
result = await OptimizedAssignmentService.fetchAllAssignments(
  user.role, user.email, selectedDepartmentId, selectedSubDepartmentId
);
```

#### DepartmentSelector.tsx - kompakt breadcrumb:
```tsx
// Vis som: "Afd. 02 / Fugt & Skimmel ▾"
// Alt i een linje, venstre side af headeren
// Separator "/" mellem afdeling og underafdeling
```

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| Ny SQL migration | RLS fix, sub_department_id paa cars + warehouse, RPC update |
| `src/hooks/employee/useEmployeeData.ts` | Ret type-cast til `Employee['role']` |
| `src/components/Layout/NavComponents/DepartmentSelector.tsx` | Breadcrumb-stil, animation |
| `src/context/DepartmentContext.tsx` | Cache clear ved sub-dept switch |
| `src/hooks/useOptimizedAssignments.ts` | Send + filtrer sub_department_id |
| `src/services/optimizedAssignmentService.ts` | Accepter sub_department_id |
| `src/types/car.ts` + `src/components/Cars/types.ts` | Tilfoej sub_department_id |
| `src/services/carSecurityService.ts` | Filtrer paa sub_department_id |
| `src/hooks/car/useCarData.ts` | Sub-dept i queryKey og fetch |
| `src/components/Cars/CarFormDialog.tsx` | Underafdelings-vaelger |
| `src/types/warehouse.ts` | Tilfoej sub_department_id |
| `src/hooks/warehouse/useWarehouseData.ts` | Filtrer paa sub_department_id |
