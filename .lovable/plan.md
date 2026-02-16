

## Fase 10: Sikkerhedspanel-oprydning ✅ (Gennemført 2026-02-16)


Maal: Nul aktive errors/warnings i sikkerhedspanelet uden at miste funktionalitet.

---

### Oversigt over aktive fund

**Errors (3):**
1. `cleanup_no_auth` - Edge functions uden autentificering
2. `storage_bucket_overpermissive` - Storage bucket for aaben
3. `PUBLIC_USER_DATA` / `EXPOSED_SENSITIVE_DATA` - profiles + user_roles laesbare for alle

**Warnings (6):**
4. `reply_msg_no_validation` - Manglende laengdevalidering paa beskeder/kommentarer
5. `definer_no_search_path` - 4 SECURITY DEFINER funktioner mangler search_path
6. Case folder / OneDrive / vacation / assignment messages+files RLS advarsler

**Infos (3):**
7. `demo_pass_in_migrations` - Demo-password i migrationsfiler
8. `chart_dangerous_html` - dangerouslySetInnerHTML i chart.tsx (shadcn/ui)

**Logging (produktionslogs):**
9. Uguardede console.log i 10+ filer (weekFormatting, UserManagement, demoUserService, secureProfileService, m.fl.)

---

### Trin 1: SQL-migrering (samlet)

**1a) Tilfoej search_path til 4 SECURITY DEFINER funktioner:**

Genskabes med `SET search_path = public`:
- `can_user_access_assignment(uuid, uuid)`
- `can_access_assignment(uuid)` 
- `is_admin_user()`
- `get_current_user_role()`

**1b) Tilfoej CHECK constraints paa beskeder og kommentarer:**

```text
ALTER TABLE assignment_messages 
ADD CONSTRAINT message_length_check 
CHECK (length(message) <= 5000 AND length(trim(message)) > 0);

ALTER TABLE assignment_files 
ADD CONSTRAINT comment_length_check 
CHECK (comment IS NULL OR length(comment) <= 2000);
```

**1c) Stram storage bucket policy:**

Erstat den aabne SELECT-policy paa `assignment-files` med en der tjekker opgaveadgang via `assignment_files`-tabellens RLS (som allerede er strammet).

---

### Trin 2: Edge functions autentificering

Tilfoej API-noegle-validering til de 3 uautentificerede edge functions:
- `cleanup-expired-users`
- `cleanup-change-logs` 
- `send-duty-reminders`

Disse er cron-job-funktioner der kun skal kaldes af systemet. Loesung: Tilfoej en simpel hemmelighed (`CRON_SECRET`) som header-check. Hvis headeren mangler eller er forkert, returneres 401.

```text
const cronSecret = Deno.env.get('CRON_SECRET');
const providedSecret = req.headers.get('x-cron-secret');
if (!cronSecret || providedSecret !== cronSecret) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

Alternativt markeres disse som acceptable (de koerer allerede med verify_jwt=false fordi de kaldes af pg_cron, ikke af brugere).

---

### Trin 3: Fjern uguardede console.log fra produktion

Wrap alle uguardede `console.log/warn/error` i `import.meta.env.DEV` guard i foelgende filer:

| Fil | Antal |
|-----|-------|
| `src/utils/dates/weekFormatting.ts` | 4 (log+error) |
| `src/components/Admin/UserManagement.tsx` | 5+ (log+warn) |
| `src/services/demoUserService.ts` | 8+ (log+warn) |
| `src/services/secureProfileService.ts` | 6 (error+warn) |
| `src/services/securityManager.ts` | 8 (error+warn) |
| `src/services/carSecurityService.ts` | 3 (error+warn) |
| `src/hooks/duty/useDutyActions.ts` | 4 (error) |
| `src/hooks/assignment/useAssignmentMessages.ts` | 3 (error) |
| `src/hooks/assignment/useAssignmentFiles.ts` | 8 (error+warn) |
| `src/components/Admin/PasswordChangeDialog.tsx` | 2 (error) |
| `src/components/Admin/LocationManagement.tsx` | 1 (error) |
| `src/components/Admin/UserFormDialog.tsx` | 2 (warn+error) |
| `src/context/AuthContext.tsx` | ~5 uguardede (error+warn) |
| `src/context/NotificationContext.tsx` | 1 (warn) |

Error-logs beholdes men wraps i DEV-guard. Fejlhaandtering via toast forbliver uaendret.

---

### Trin 4: Ignorer/opdater acceptable findings

Foelgende findings markeres som "ignoreret med begrundelse" i sikkerhedspanelet:

1. **profiles/user_roles offentligt laesbare** - Allerede dokumenteret som noedvendigt for app-funktionalitet (navne, roller i UI). Begge er korrekt markeret i arkitekturdokumentationen.

2. **chart.tsx dangerouslySetInnerHTML** - shadcn/ui bibliotekskode, data kommer fra interne konstanter, ikke brugerinput.

3. **Demo-password i migrationsfiler** - Demo-kontoen er isoleret med RESTRICTIVE RLS og 15-min TTL. Passwordet giver kun adgang til sandboxed demo-data.

4. **planner_change_log admin-only** / **onedrive_settings admin-only** - Korrekt konfigureret, intet at rette.

5. **Case folder / OneDrive / vacation / assignment messages+files advarsler** - RLS-funktionerne (`can_access_case_data`, `can_access_vacation`) er allerede verificeret i Fase 5. Assignment messages/files er strammet i migration 20260212140657.

---

### Trin 5: Klient-side validering (beskeder og kommentarer)

Tilfoej laengde-validering i:
- `useAssignmentMessages.ts`: Max 5000 tegn paa beskeder
- `useAssignmentFiles.ts`: Max 2000 tegn paa kommentarer

---

### Trin 6: Dokumentation

- Opdater `CHANGELOG.md` med alle sikkerhedsrettelser
- Opdater `docs/implementation-plan/tasks.md` med ny fase 10
- Marker rettede punkter med flueben

---

### Raekkefoelge

1. SQL-migrering (search_path + CHECK constraints + storage policy)
2. Edge function autentificering eller accept
3. Console.log oprydning (14+ filer)
4. Klient-side validering (2 filer)
5. Marker acceptable findings som ignoreret
6. Opdater dokumentation

### Kvalitetstjek

- Ingen foelsom data logges i produktion
- RLS-politikker styrkes (search_path, CHECK constraints)
- Storage bucket strammes
- Eksisterende funktionalitet uaendret
- Overholder tekniske specifikationer og UI-guidelines

