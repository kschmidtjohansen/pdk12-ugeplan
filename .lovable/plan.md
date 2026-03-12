

## Plan: "Uden afdeling" ved oprettelse af medarbejdere

### Problem
Når man opretter en medarbejder, bliver vedkommende automatisk tilknyttet den aktuelt valgte afdeling. IT-supportere, der skal være Super Admin, tilhører ikke en driftsafdeling og skal kunne oprettes uden afdelingstilknytning.

### Ændringer

#### 1. `src/hooks/employee/useEmployeeFormState.ts`
- Tilføj `skip_department: boolean` til `EmployeeFormData`
- Default `false`, sættes automatisk til `true` når rollen ændres til `super_admin`

#### 2. `src/components/Employees/EmployeeFormDialog.tsx`
- Tilføj en checkbox "Uden afdeling (IT-support)" der vises når rollen er `super_admin`
- Checkbox styrer `formData.skip_department`
- Vis en kort forklaringstekst under checkbox

#### 3. `src/hooks/employee/useEmployeeCreation.ts`
- Check `formData.skip_department` — hvis `true`, spring `user_access` insert og `home_department_id` update over (linje 264-286)

#### 4. `supabase/functions/admin-create-user/index.ts`
- Ingen ændring nødvendig — edge function håndterer ikke afdelingstilknytning

#### 5. `src/translations/da/employees.ts` + `src/translations/en/employees.ts`
- Tilføj nøgler: `skipDepartment`, `skipDepartmentNote`

#### 6. `ONBOARDING.md`
- Opdater sektion 8 (Opret brugere) med info om "Uden afdeling" muligheden for Super Admin / IT-support

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/hooks/employee/useEmployeeFormState.ts` | Tilføj `skip_department` felt |
| `src/components/Employees/EmployeeFormDialog.tsx` | Tilføj "Uden afdeling" checkbox |
| `src/hooks/employee/useEmployeeCreation.ts` | Skip afdeling hvis `skip_department` |
| `src/translations/da/employees.ts` | Nye oversættelser |
| `src/translations/en/employees.ts` | Nye oversættelser |
| `ONBOARDING.md` | Opdater brugeroprettelsessektion |

