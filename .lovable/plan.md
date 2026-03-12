

## Plan: Super Admin skal kunne vælge afdelinger

### Problem
Når rollen ændres til `super_admin`, sættes `skipDepartment` automatisk til `true` (linje 90-91 i `UserFormDialog.tsx`). Det betyder at afdelingslisten skjules og man tvinges til at oprette uden afdeling. Super Admins som dig (tilknyttet afdeling 12) skal kunne vælge afdelinger.

### Ændring

**Fil:** `src/components/Admin/UserFormDialog.tsx`

1. **Fjern auto-toggle** (linje 88-95): Slet useEffect der sætter `skipDepartment = true` ved `super_admin`. Default forbliver `false`, så afdelingslisten altid vises.
2. **Bevar checkbox**: "Uden afdeling (IT-support)" checkboxen forbliver tilgængelig for `super_admin` som en frivillig mulighed — ikke tvunget.
3. **Redigering af eksisterende super_admin**: Behold logikken der sætter `skipDepartment = true` kun hvis brugeren faktisk ikke har nogen `user_access`-rækker (linje ~155-165, allerede korrekt).

Én fil ændres, én linje-blok fjernes.

