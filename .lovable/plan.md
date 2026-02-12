

## Plan: Servicemedarbejder kan se alle medarbejdere i afdelingen

### Problem

En servicemedarbejder kan kun se sig selv i /employees. Aarsagen er RLS-policyen paa `user_access`-tabellen:

```sql
-- Nuvaerende policy: "Users can view own access"
user_id = auth.uid() OR is_super_admin() OR (is_admin_user() AND department_id = ANY(get_user_department_ids()))
```

Naar `useEmployeeData.ts` (linje 214) henter `user_access`-records for den valgte afdeling, faar en servicemedarbejder kun sin egen record tilbage. Dermed filtreres medarbejderlisten ned til kun dem selv.

### Loesning

Opdater RLS-policyen paa `user_access` saa alle autentificerede brugere kan se access-records for afdelinger de selv tilhoerer. Dette er sikkert fordi `user_access` kun indeholder `user_id`, `department_id` og `sub_department_id` - ingen foelsom data.

### Tekniske detaljer

**1. Database migration: Opdater `user_access` SELECT policy**

Erstat den eksisterende SELECT-policy med:

```sql
DROP POLICY "Users can view own access" ON public.user_access;

CREATE POLICY "Users can view department access"
ON public.user_access
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR is_super_admin()
  OR department_id = ANY(get_user_department_ids(auth.uid()))
);
```

Dette tillader enhver bruger at se alle `user_access`-records for afdelinger de selv har adgang til - uanset rolle. Super admins kan se alt.

**2. Ingen kodeaendringer noevendige i `useEmployeeData.ts`**

Den eksisterende logik (linje 212-240) fungerer allerede korrekt - den henter `user_access` for den valgte afdeling og filtrerer medarbejdere derefter. Problemet er udelukkende at RLS blokerer visningen af andre brugeres records.

**3. CHANGELOG.md opdatering**

Tilfoej under `[Unreleased]`:

```
### Fixed - 2025-02-12
- Servicemedarbejdere kan nu se alle medarbejdere i deres afdeling (ikke kun sig selv)

### Changed - 2025-02-12
- Login kræver ikke længere valg af afdeling (automatisk tildeling efter login)
- Super Admin kan skifte afdeling i demo mode via header-selector
```

**4. README.md opdatering**

Tilfoej i features-listen (baade dansk og engelsk):
- Afdelingsbaseret login (automatisk tildeling)
- Lokationsstyring i admin-panelet

Opdater rolletabellen:
- Servicemedarbejder: "Kan se alle medarbejdere i afdelingen, se egne opgaver, anmode om ferie" (i stedet for kun "se egne opgaver")

---

### Filer der aendres

| Fil | Type | AEndring |
|-----|------|---------|
| `supabase/migrations/[timestamp]_fix_user_access_select.sql` | NY | Opdater RLS policy paa user_access |
| `CHANGELOG.md` | OPDATER | Tilfoej fix + login-aendring |
| `README.md` | OPDATER | Opdater rolle-beskrivelser og features |

### Sikkerhedsgarantier
- `user_access` indeholder kun `user_id`, `department_id`, `sub_department_id` - ingen PII eller foelsom data
- Brugere kan kun se records for afdelinger de selv tilhoerer
- Super admin-adgang forbliver uaendret
- Ingen aendringer i frontend-logik, kun databaselag

