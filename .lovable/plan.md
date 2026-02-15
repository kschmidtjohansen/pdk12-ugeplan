
## Fase 1: Sikkerhedsrettelser

### 1. RLS-laekage: vacations-tabellen

**Status**: `can_access_vacation()` funktionen tillader allerede kun skadeledere at se ferier for brugere i **samme afdeling** (via `user_access.department_id` join). Den er korrekt implementeret med `SECURITY DEFINER`.

**Anbefaling**: Ingen SQL-aendring nødvendig. Funktionen matcher allerede kravet:
- Egen ferie: altid synlig
- Super admin / administrator: fuld adgang
- Skadeleder: kun brugere der deler mindst en `department_id` via `user_access`

Klient-side hooket `useVacationSecurity.ts` bruger `sub_department_id` til filtrering, hvilket giver endnu finere granularitet.

**Handling**: Dokumenter dette som verificeret i `tasks.md`.

---

### 2. Logging af folsom data: PasswordChangeDialog.tsx

**Status**: Filen er allerede renset. Der er ingen `console.log` der udskriver tokens, passwords eller auth-metadata. Kun en `console.error` paa linje 99 der logger fejlbeskeder (ikke folsomme data).

**Handling**: Dokumenter som verificeret.

---

### 3. JWT-validering i admin-reset-password Edge Function

**Status**: Funktionen har `verify_jwt = false` i `config.toml` men udforer **manuel JWT-validering** i koden:
- Linje 123-150: Verificerer Authorization header og token-format
- Linje 183-204: Kalder `supabase.auth.getUser()` med brugerens token
- Linje 210-240: Tjekker rolle (`administrator` eller `super_admin`)

**Problem**: Funktionen har **overdreven logging** af folsom data:
- Linje 109: Logger klient-IP
- Linje 138: Logger token-laengde
- Linje 156-158: Logger Supabase URL, service key present, anon key present
- Linje 192: Logger bruger-ID og email
- Linje 206: Logger bruger-email
- Linje 219: Logger email og rolle ved afvist adgang
- Linje 262: Logger target user ID og password-laengde
- Linje 327: Logger admin email og target user ID i security event

**Handling**:
1. Fjern logging af token-laengde (linje 138)
2. Fjern logging af key-presence (linje 157-158)
3. Fjern logging af bruger-email (linje 192, 206, 219)
4. Fjern logging af password-laengde (linje 262)
5. Bevar `requestId`-baseret flow-logging (uden folsomme data)
6. Tilfoej kommentarer der dokumenterer den manuelle JWT-validering

---

### 4. Generelt console.log scan

Filer med uguardede `console.log` der eksponerer brugerdata i produktion:

| Fil | Problem | Handling |
|-----|---------|---------|
| `src/components/Auth/EnhancedSecureLoginForm.tsx:48` | Logger email ved login-forsoeg | Wrap i `import.meta.env.DEV` |
| `src/components/Auth/EnhancedSecureLoginForm.tsx:63,74` | Logger login-resultat | Wrap i `import.meta.env.DEV` |
| `src/hooks/notifications/notificationRealtime.ts:94,113,129,155,178,184` | Logger user.id og notification payloads | Wrap i `import.meta.env.DEV` |
| `src/hooks/notifications/notificationActions.ts:115` | Logger user.id ved sletning | Wrap i `import.meta.env.DEV` |
| `src/hooks/notifications/notificationFetching.ts:35,49` | Logger user.id og rolle | Wrap i `import.meta.env.DEV` |
| `src/hooks/vacation/useVacationRequestActions.ts:92,126,202,215,219,233,251,261` | Logger ferie-data med user_id | Wrap i `import.meta.env.DEV` |
| `src/hooks/vacation/useVacationSecurity.ts:37` | Logger antal brugere i underafdelinger | Wrap i `import.meta.env.DEV` |
| `src/hooks/assignment/useAssignmentFormState.ts:42,81` | Logger user.id | Wrap i `import.meta.env.DEV` |
| `src/hooks/assignment/useAssignmentActions.ts:150,426` | Logger responsible user ID | Wrap i `import.meta.env.DEV` |
| `src/hooks/employee/useEmployeeCreation.ts:25,50,116,126` | Logger user creation og email/password validation | Wrap i `import.meta.env.DEV` |
| `src/pages/Index.tsx:118,122` | Logger auth-status | Wrap i `import.meta.env.DEV` |
| `src/pages/PasswordResetPage.tsx:158,162` | Logger recovery mode (ikke guarded) | Wrap i `import.meta.env.DEV` |
| `src/pages/ScreenDisplayPage.tsx:18,30,44,63,84,95,101,103` | Logger URL og dato-data | Wrap i `import.meta.env.DEV` |
| `src/utils/databaseCleanup.ts:7,37,50,83,96,110` | Logger cleanup-operationer | Wrap i `import.meta.env.DEV` |

---

### Samlet filplan

| Fil | Handling |
|-----|---------|
| `supabase/functions/admin-reset-password/index.ts` | Fjern folsom logging, tilfoej JWT-dokumentation |
| `src/components/Auth/EnhancedSecureLoginForm.tsx` | Wrap 3 console.log i DEV guard |
| `src/hooks/notifications/notificationRealtime.ts` | Wrap 7 console.log i DEV guard |
| `src/hooks/notifications/notificationActions.ts` | Wrap 1 console.log i DEV guard |
| `src/hooks/notifications/notificationFetching.ts` | Wrap 2 console.log i DEV guard |
| `src/hooks/vacation/useVacationRequestActions.ts` | Wrap 8 console.log i DEV guard |
| `src/hooks/vacation/useVacationSecurity.ts` | Wrap 1 console.log i DEV guard |
| `src/hooks/assignment/useAssignmentFormState.ts` | Wrap 2 console.log i DEV guard |
| `src/hooks/assignment/useAssignmentActions.ts` | Wrap 2 console.log i DEV guard |
| `src/hooks/employee/useEmployeeCreation.ts` | Wrap 4 console.log i DEV guard |
| `src/pages/Index.tsx` | Wrap 2 console.log i DEV guard |
| `src/pages/PasswordResetPage.tsx` | Wrap 2 console.log i DEV guard |
| `src/pages/ScreenDisplayPage.tsx` | Wrap 8 console.log i DEV guard |
| `src/utils/databaseCleanup.ts` | Wrap 6 console.log i DEV guard |
| `docs/implementation-plan/tasks.md` | Tilfoej Fase 5 med nye sikkerhedsopgaver markeret [x] |
| `CHANGELOG.md` | Dokumenter alle aendringer |

### Hvad der IKKE aendres

- Logikken for password-skift (kun logging fjernes)
- Logikken for ferie-oprettelse (kun logging guards tilfojes)
- RLS-politikker paa vacations (allerede korrekte)
- Edge function funktionalitet (kun logging reduceres og kommentarer tilfojes)
