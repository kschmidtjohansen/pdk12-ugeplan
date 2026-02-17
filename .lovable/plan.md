

## Fix: Ny medarbejder faar ikke afdelingstilknytning ved oprettelse

### Problem
Naar en medarbejder oprettes fra Medarbejder-siden, oprettes kun en `profiles`-raekke og en `user_roles`-raekke. Der oprettes ALDRIG en `user_access`-record, som er den tabel der styrer afdelingstilknytning. Filtreringen i `useEmployeeData` (linje 127-144) bruger `user_access` til at bestemme hvilke medarbejdere der hoerer til den valgte afdeling. Uden en `user_access`-record vises den nye medarbejder derfor som "Uden afdeling".

### Rodaarsag
Hverken `useEmployeeCreation.ts` (frontend) eller `admin-create-user` edge function opretter `user_access`-records. Til sammenligning goer `UserFormDialog.tsx` (admin-panelet) dette korrekt via `saveUserAccess()` (linje 156-178).

### Loesning
Tilfoej `user_access`-oprettelse i `useEmployeeCreation.ts` efter succesfuld medarbejderoprettelse. Brug den aktive `selectedDepartmentId` og `selectedSubDepartmentId` fra `DepartmentContext`. Saet ogsaa `home_department_id` paa profilen.

### Aendringer

**`src/hooks/employee/useEmployeeCreation.ts`**

1. Importer `useDepartment` fra `@/context/DepartmentContext`
2. Hent `selectedDepartmentId` og `selectedSubDepartmentId` i hook'en
3. Efter succesfuld oprettelse (linje 220-260), tilfoej:
   - Indsaet en `user_access`-record med `user_id`, `department_id` (= selectedDepartmentId), og eventuelt `sub_department_id`
   - Opdater `profiles.home_department_id` til `selectedDepartmentId`

Kode der tilfojes (efter linje 259, foer toast):

```text
// Tilknyt medarbejder til aktiv afdeling
if (selectedDepartmentId && userId) {
  const accessRecord: any = {
    user_id: userId,
    department_id: selectedDepartmentId,
  };
  if (selectedSubDepartmentId) {
    accessRecord.sub_department_id = selectedSubDepartmentId;
  }
  const { error: accessError } = await client
    .from('user_access')
    .insert(accessRecord);
  if (accessError && import.meta.env.DEV) {
    console.warn('[useEmployeeCreation] user_access insert warning:', accessError);
  }

  // Saet home_department_id paa profilen
  const { error: homeDeptError } = await client
    .from('profiles')
    .update({ home_department_id: selectedDepartmentId })
    .eq('id', userId);
  if (homeDeptError && import.meta.env.DEV) {
    console.warn('[useEmployeeCreation] home_department_id update warning:', homeDeptError);
  }
}
```

**`CHANGELOG.md`** - Dokumenter rettelsen.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/hooks/employee/useEmployeeCreation.ts` | Tilfoej user_access + home_department_id ved oprettelse |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Ny medarbejder vises straks i den aktive afdeling efter oprettelse
- `user_access`-record oprettes med korrekt department_id og sub_department_id
- `home_department_id` saettes paa profilen
- RLS tillader insert i `user_access` for admin/super_admin (bekraeftet i schema)
- Ingen console.log uden DEV-guard
- Eksisterende admin-panel oprettelse (UserFormDialog) paavirkes ikke
