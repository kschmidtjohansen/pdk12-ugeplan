

## Fix: Synkroniser auth.users email for Petrie Rasmussen

### Rodaarsag

Petrie Rasmussen har to forskellige emails:
- `profiles.email`: `petrie.rasmussen@polygongroup.com` (det du forsoejer at logge ind med)
- `auth.users.email`: `vikar-1761309097683-f4a0216d@temp.local` (det Supabase Auth faktisk bruger)

Login bruger **altid** `auth.users.email` til autentificering. Passwordnulstilling virker korrekt mod `auth.users`, men da emailen der er en `@temp.local` adresse, kan du ikke logge ind med `petrie.rasmussen@polygongroup.com`.

Brugeren har `last_sign_in_at = NULL` — dvs. har aldrig vaeret logget ind.

### Loesning

Opdater `auth.users.email` saa den matcher `profiles.email`. Dette kraever en SQL-migrering med `auth.admin` funktionalitet, da `auth.users` ikke kan opdateres direkte via RLS.

**SQL-migrering:**

```sql
-- Synkroniser auth.users email med profiles email for Petrie Rasmussen
-- Bruger-ID: 892bcee4-9639-4809-a52f-2a9c5e20e063
-- Fra: vikar-1761309097683-f4a0216d@temp.local
-- Til: petrie.rasmussen@polygongroup.com

UPDATE auth.users 
SET email = 'petrie.rasmussen@polygongroup.com',
    raw_user_meta_data = raw_user_meta_data || '{"name": "Petrie Rasmussen"}'::jsonb,
    updated_at = now()
WHERE id = '892bcee4-9639-4809-a52f-2a9c5e20e063'
  AND email = 'vikar-1761309097683-f4a0216d@temp.local';
```

### Forebyggelse

Derudover boer `admin-create-user` edge function og `UserFormDialog` sikre at naar en vikar opgraderes eller en bruger oprettes, bruges den rigtige email i baade `auth.users` og `profiles`.

Tjek om der er andre brugere med samme mismatch:

```sql
SELECT p.id, p.name, p.email as profile_email, u.email as auth_email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email != u.email AND p.is_demo = false;
```

Hvis der er flere, skal de ogsaa synkroniseres.

### Trin

1. Koer mismatch-query for at finde alle beroorte brugere
2. Opret SQL-migrering der synkroniserer `auth.users.email` med `profiles.email` for alle beroorte
3. Opdater `CHANGELOG.md`
4. Verificer at Petrie kan logge ind efter migrering

### Kvalitetstjek

- Ingen foelsom data logges (kun bruger-ID og email i migrering-kommentarer)
- Live-data pavirkes: ja, dette er en noedvendig fix for at brugeren kan logge ind
- RLS-politikker uaendrede
