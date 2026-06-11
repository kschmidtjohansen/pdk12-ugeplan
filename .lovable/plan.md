## Findings

**Rolle-redigering fejler** efter multi-role blev aktiveret:
- `supabase/functions/admin-user-role/index.ts` verificerer kalderens admin-status med
  ```ts
  supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
  ```
  Når en administrator nu kan have flere rækker i `user_roles` (fx Administrator + Fugttekniker), returnerer `maybeSingle()` PostgREST-fejlen `PGRST116 ("more than one row returned")`. Edge-funktionen svarer derfor 500 *"Failed to verify user permissions"* — og UI viser "fejl" i stedet for at gemme rollen.
- Resten af funktionen er allerede multi-role korrekt (sletter alle og indsætter den fulde liste).

**Manglende oversættelse:**
- `src/components/Admin/UserFormDialog.tsx:437` slår `admin.userManagement.multiRoleHelp` op, men nøglen findes ikke i `src/translations/{da,en}/admin.ts` (kun `userManagement: {}` containeren findes på linje 247 i begge filer). Derfor falder den til den hardcodede fallback.

## Plan

### 1. Edge function: tillad flere roller på kalderen
I `supabase/functions/admin-user-role/index.ts` (linje ~110-118) udskift admin-check:
```ts
const { data: callerRoles, error: roleError } = await supabaseAdmin
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id);

const callerRoleList = (callerRoles ?? []).map(r => r.role);
const isAdminCaller = callerRoleList.some(r => r === 'administrator' || r === 'super_admin');
```
Tilret den efterfølgende `if (!roleData || !['administrator','super_admin'].includes(roleData.role))` til at bruge `isAdminCaller`, og log `callerRoleList` i stedet for `roleData.role`. Ingen øvrige ændringer behøves — sletning + multi-insert er allerede korrekt.

### 2. Tilføj oversættelsen `admin.userManagement.multiRoleHelp`
- `src/translations/da/admin.ts` (inde i `userManagement` blokken): `multiRoleHelp: 'Vælg én eller flere roller. Rollen med flest rettigheder bestemmer brugerens adgang; medarbejdere med flere roller vises i alle relevante lister.'`
- `src/translations/en/admin.ts`: `multiRoleHelp: 'Select one or more roles. The most privileged role determines access; employees with multiple roles appear in every relevant list.'`
- `UserFormDialog.tsx` fallback-strengen lades urørt (sikkerhedsnet).

### 3. Changelog
Ny entry `2026-06-11 — Fix: multi-role admin kunne ikke redigere roller + manglende oversættelse multiRoleHelp`.

## Verifikation
- Som administrator med ekstra rolle (fx Administrator + Fugttekniker): rediger en medarbejders roller → forventet 200 fra `admin-user-role`, ingen 500-fejl, rollerne gemmes.
- `UserFormDialog`: hjælpetekst under rolle-checkboxes viser den oversatte streng i stedet for fallback.

Ingen DB-/schema-ændringer.