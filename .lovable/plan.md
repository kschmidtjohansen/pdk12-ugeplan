

## Sikkerheds- og konfigurationsrettelser

### Overblik

Tre rettelser fordelt over 3 filer og 1 SQL-migration. Ingen UI-elementer eller forretningslogik aendres.

---

### Rettelse 1: RLS-begraensning paa vacations-tabellen

**Problem:** Skadeledere kan se ALLE ferieanmodninger paa tvaers af afdelinger. De boer kun se ferie for brugere i deres egne afdelinger.

**Loesning:** Oprette en ny `SECURITY DEFINER`-funktion `can_access_vacation` og opdatere de 5 relevante RLS-policies.

**Ny funktion:**
```sql
CREATE OR REPLACE FUNCTION public.can_access_vacation(vacation_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Egen ferie
    vacation_user_id = auth.uid()
    -- Super admin / administrator: fuld adgang
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'administrator')
    )
    -- Skadeleder: kun hvis ferie-brugeren deler mindst en afdeling
    OR (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'skadeleder'
      )
      AND EXISTS (
        SELECT 1
        FROM user_access AS my_access
        JOIN user_access AS their_access
          ON my_access.department_id = their_access.department_id
        WHERE my_access.user_id = auth.uid()
          AND their_access.user_id = vacation_user_id
      )
    )
  $$;
```

**Policies der opdateres (drop + recreate):**

| Policy | Nuvaerende logik | Ny logik |
|--------|-----------------|----------|
| `vacations_secure_access` (SELECT) | `is_admin_or_skadeleder()` | `can_access_vacation(user_id)` |
| `vacation_insert_policy` (INSERT) | `is_admin_or_skadeleder()` | `is_admin_user()` (skadeledere behoever ikke oprette for andre) |
| `vacation_update_policy` (UPDATE) | `is_admin_or_skadeleder()` | `can_access_vacation(user_id)` |
| `vacation_delete_policy` (DELETE) | `is_admin_or_skadeleder()` | `can_access_vacation(user_id)` |
| `Users can view accessible vacations` (SELECT) | `is_admin_user() OR skadeleder` | `can_access_vacation(user_id)` |
| `Users can update own vacation requests` (UPDATE) | `is_admin_user() OR skadeleder` | `can_access_vacation(user_id)` |
| `Users can delete own vacation requests` (DELETE) | `is_admin_user()` | `can_access_vacation(user_id)` |

Alle eksisterende policies droppes og genaendres til at bruge den nye funktion, saa der kun er een SELECT, een INSERT, een UPDATE og een DELETE policy.

**Frontend-pavirkning:** Ingen. `useVacationSecurity.ts` laver allerede sin egen client-side filtrering, men den rigtige adgangskontrol sker nu ogsaa i databasen.

---

### Rettelse 2: Fjernelse af foelsom logging i PasswordChangeDialog.tsx

**Fil:** `src/components/Profile/PasswordChangeDialog.tsx`

**Fjernes (3 linjer):**
- Linje 80: `console.log('[PasswordChangeDialog] Starting password change process');`
- Linje 89: `console.error('[PasswordChangeDialog] Current password verification failed:', signInError);`
- Linje 122: `console.log('[PasswordChangeDialog] Password updated successfully');`

**Beholdes (uaendret):**
- Linje 101: `console.error('[PasswordChangeDialog] Password update failed:', updateError);` -- beholdes, da den kun logger generisk fejlbesked, ikke credentials
- Linje 135: `console.error('[PasswordChangeDialog] Unexpected error:', error);` -- generisk fejl, ingen foelsom data
- Al toast-logik, validering og UI forbliver uaendret

---

### Rettelse 3: Kommentar i config.toml

**Fil:** `supabase/config.toml`

**Aendring:** Tilfoej en forklarende kommentar over `[functions.admin-reset-password]`:

```toml
# verify_jwt is disabled because this function performs manual JWT validation
# internally to support the admin password reset flow. Do not enable verify_jwt
# without removing the manual validation logic inside the function.
[functions.admin-reset-password]
verify_jwt = false
```

---

### Filer der aendres

| Fil | Type aendring |
|-----|---------------|
| `supabase/migrations/<new>.sql` | Ny migration: opretter funktion + opdaterer 7 policies |
| `src/components/Profile/PasswordChangeDialog.tsx` | Fjerner 3 console.log/error-linjer |
| `supabase/config.toml` | Tilfoejer kommentar (3 linjer) |

### Sikkerhed

- Skadeledere kan kun se ferie i deres egne afdelinger (ikke alle)
- Admins og super_admins bevaerer fuld adgang
- Brugere kan stadig se og administrere deres egne ferieanmodninger
- Ingen UI-elementer fjernes eller aendres
- Foelsom auth-logging fjernes fra browser-konsollen

