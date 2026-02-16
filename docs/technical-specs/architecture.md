# Arkitektur og Sikkerhed

Detaljeret beskrivelse af projektets sikkerhedsarkitektur, kryptering, adgangskontrol og edge function-standarder.

---

## Autentificering

- **Supabase Auth** håndterer al bruger-autentificering
- Passwords hashes med **bcrypt** (håndteret af Supabase Auth internt)
- JWT-tokens udstedes ved login og verificeres i alle beskyttede endpoints
- Roller gemmes i `user_roles`-tabellen (ikke i JWT claims)

## Kryptering

### HMAC SHA256
- Database-funktion `hmac_sha256(key, data)` tilgængelig til signering/verifikation
- Bruges til token-verifikation og data-integritet

### Passwords
- Håndteres udelukkende af Supabase Auth (bcrypt)
- Ingen passwords gemmes i `profiles` eller andre public-schema tabeller
- Klient-side validering via `validatePassword()` i `src/utils/inputSanitization.ts`

---

## Row Level Security (RLS)

### Alle tabeller har RLS aktiveret

### Hjælpefunktioner (SECURITY DEFINER)

| Funktion | Formål |
|----------|--------|
| `is_admin_or_skadeleder()` | Returnerer `true` for administrator + skadeleder roller |
| `is_super_admin(_user_id?)` | Tjekker super_admin rolle |
| `is_admin_user()` | Tjekker administrator rolle |
| `can_access_department_data(_dept_id, _sub_dept_id?, _user_id?)` | Afdelingsbaseret adgangskontrol |
| `can_access_vacation(vacation_user_id)` | Ferie-adgang: egen bruger, admin, eller skadeleder i samme afdeling |
| `can_user_access_assignment(assignment_id, user_id)` | Opgave-adgang via tilknytning |
| `can_view_assignment_optimized(assignment_id, user_id)` | Optimeret version af opgave-adgang |
| `can_view_fuel_codes()` | Brændstofkort-visning (admin, skadeleder, super_admin) |
| `get_current_user_role()` | Henter aktuel brugers rolle |
| `get_user_department_ids(_user_id?)` | Returnerer array af brugerens afdelings-ID'er |

### Adgangsmønstre

| Tabel | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Alle autentificerede | Egen profil / admin | Egen profil / admin | Admin |
| `user_roles` | Alle autentificerede | Service role | Service role | Service role |
| `assignments` | Admin/skadeleder/tilknyttet | Admin/skadeleder | Admin/skadeleder/ansvarlig | Admin/skadeleder |
| `cars` | Alle autentificerede | Admin/skadeleder | Admin/skadeleder | Admin/skadeleder |
| `vacations` | Egen/admin/skadeleder (afd.) | Egen/admin | Egen (pending)/admin/skadeleder | Egen (pending)/admin |
| `warehouse_items` | Alle | Admin/skadeleder | Admin/skadeleder | Admin/skadeleder |
| `notifications` | Egen bruger | Egen bruger | Egen bruger | Egen bruger |
| `on_call_duties` | Alle autentificerede | Admin/skadeleder | Admin/skadeleder/egen | Admin/skadeleder |
| `departments` | Alle autentificerede | Super admin | Super admin | Super admin |
| `logs` | Admin (via JWT metadata) | Admin / service role | Admin | Admin |

### Kendte undtagelser
- `profiles` og `user_roles` er **offentligt læsbare** for alle autentificerede brugere — nødvendigt for app-funktionalitet (navne, roller i UI)
- `warehouse_items` SELECT er åben for alle autentificerede brugere

---

## Edge Functions (11 stk)

### Oversigt

| Funktion | JWT-krav | Formål |
|----------|----------|--------|
| `admin-create-user` | Ja | Opret ny bruger |
| `admin-delete-user` | Ja | Slet bruger |
| `admin-list-users` | Ja | List alle brugere |
| `admin-reset-password` | **Nej** ⚠️ | Nulstil password (dokumenteret undtagelse) |
| `admin-user-delete` | Ja | Alternativ bruger-sletning |
| `admin-user-role` | Ja | Opdater brugerrolle |
| `admin-user-status` | Ja | Opdater brugerstatus |
| `cleanup-change-logs` | Ja | Opryd ændringslogge |
| `cleanup-expired-users` | Ja | Slet udløbne vikarer |
| `send-duty-reminders` | Ja | Send vagt-påmindelser |
| `swap-duties` / `swap-duty` | Ja | Byt vagter |

### Sikkerhedskrav for Edge Functions
1. **JWT-verifikation**: Alle funktioner (undtagen `admin-reset-password`) verificerer JWT-token
2. **Rolle-check**: Privilegerede handlinger kræver `super_admin`, `administrator` eller `skadeleder` rolle
3. **CORS-headers**: Inkluderet i alle responses
4. **Service role key**: Bruges kun server-side, aldrig eksponeret til klienten
5. **Minimal logging**: Ingen secrets, tokens eller passwords i logs

---

## Input-sikkerhed

### Server-side (database-funktioner)
| Funktion | Formål |
|----------|--------|
| `sanitize_text_input(input_text, max_length?)` | Fjerner farlige tegn, begrænser længde |
| `is_valid_email(email)` | E-mail format-validering |
| `is_strong_password(password)` | Password-styrke validering |
| `check_rate_limit_security(operation_key, max_attempts?, window_minutes?)` | Rate limiting |

### Klient-side (`src/utils/inputSanitization.ts`)
| Funktion | Formål |
|----------|--------|
| `sanitizeText(text, maxLength)` | Fjerner `<>`, `javascript:`, event handlers, `data:` |
| `validateAndSanitizeEmail(email)` | E-mail validering + sanitering |
| `validatePassword(password)` | Styrke-score (length, uppercase, lowercase, number) |
| `generateCSRFToken()` | CSRF-token generering |
| `ClientRateLimit` | Klient-side rate limiting (15 min vindue) |

### Sikre UI-komponenter
- `SecureInput` (`src/components/ui/secure-input.tsx`) — Input med automatisk sanitering, e-mail validering og password-styrke
- `PasswordInput` (`src/components/ui/password-input.tsx`) — Password-input med show/hide og styrke-indikator

---

## Fil-sikkerhed

- **Upload-grænse**: 20 MB per fil (valideret i `AssignmentFilesPanel`)
- **MIME-type validering**: Tjekkes ved upload
- **Storage buckets**: Supabase Storage med RLS-policies

---

## Logging-politikker

### Produktion
- **Ingen `console.log`** — alle debug-logs wrappet i `import.meta.env.DEV` guard
- Gælder: AuthContext, PlannerContent, TopNavbar, PasswordResetPage, alle Planner-komponenter

### Database-logging
- `log_security_event_safe()` bruges **sparsomt** — aldrig i realtime-handlers
- Realtime-handlers må **ikke** skrive til logs (forhindrer 170MB+ bloat)
- `log_realtime_change_throttled()` til throttled realtime-logging

### Edge Function-logging
- Minimal logging, ingen secrets i output
- Ingen service-key prefixes eller token-previews

### Kendte undtagelser
- `admin-reset-password` kører uden JWT (`verify_jwt = false` i `config.toml`)
- `profiles` og `user_roles` er offentligt læsbare (nødvendigt for UI)

---

## Data-maskering

| Funktion | Formål |
|----------|--------|
| `mask_email(p_email)` | Maskerer e-mail (f.eks. `k***@example.com`) |
| `mask_phone(p_phone)` | Maskerer telefonnummer |

---

## External APIs

### DAWA (Danmarks Adressers Web API)
- **Endpoint**: `https://api.dataforsyningen.dk/adresser/autocomplete`
- **Formål**: Adresse-autocomplete i Planner-modulet
- **Autentificering**: Ingen (åbent API)
- **Rate limiting**: Ingen officiel grænse, debounced 300ms klient-side
- **Fallback**: Manuel fritekst-indtastning hvis API fejler
- **Data brugt**: vejnavn, husnr, postnr, postnrnavn
