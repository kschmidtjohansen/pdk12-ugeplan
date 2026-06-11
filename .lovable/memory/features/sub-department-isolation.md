---
name: Sub-Department Strict Isolation
description: When a sub-department is selected, only data explicitly tied to it is visible — applies to all roles
type: feature
---

When `selectedSubDepartmentId` is non-null, filtering is **strict** for assignments, cars, and employees — regardless of role (including admin, skadeleder, super_admin):

- **Assignments:** `list_accessible_assignments_with_team` filters `a.sub_department_id = p_sub_department_id` with NO `OR IS NULL` fallback.
- **Cars:** `CarSecurityService.fetchCars` filters via `car_sub_departments` link table only (`.in('id', carIds)`). If no cars are linked, returns empty — no fallback to department-level cars.
- **Employees:** `useEmployeeData` joins `user_access` and filters `sub_department_id = selectedSubDepartmentId`. Super_admins without a user_access row are only visible when no sub-department is selected.

Sub-department assignment for employees is set via the "Underafdeling" dropdown in `EmployeeFormDialog` → persisted to `user_access.sub_department_id` for the relevant department row.

Existing data without `sub_department_id` is invisible in sub-dept views; only shows in "Alle" (no sub-dept selected).

**Never** add `OR sub_department_id IS NULL` fallbacks back into queries.
