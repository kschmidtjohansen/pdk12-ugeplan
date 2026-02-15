# Technical Specs

Denne mappe indeholder de tekniske standarder og arkitekturregler for projektet. Alle kodeændringer skal overholde disse specifikationer.

## Database-arkitektur

### Tabeller
- **24 tabeller** i `public` schema med fuld RLS
- Junction-tabeller: `assignments_employees`, `car_sub_departments`, `user_access`
- Partitioneret logging: `logs_partitioned` med månedlige partitioner

### RLS-politikker
- Alle tabeller har Row Level Security aktiveret
- Adgangskontrol via hjælpefunktioner: `can_access_department_data()`, `can_access_vacation()`, `is_admin_or_skadeleder()`, `is_super_admin()`
- `profiles` og `user_roles` er offentligt læsbare (nødvendigt for app-funktionalitet)

### Kryptering og sikkerhed
- Passwords håndteres af Supabase Auth (bcrypt)
- SHA256 HMAC tilgængelig via `hmac_sha256()` database-funktion
- JWT-verifikation i alle edge functions
- Rolle-check (`super_admin`, `administrator`, `skadeleder`) før privilegerede handlinger

## Logging-politikker

- **Produktion**: Ingen `console.log` — alle debug-logs wrapped i `import.meta.env.DEV`
- **Database-logs**: Brug `log_security_event_safe()` sparsomt (undgå realtime-handlers)
- **Edge functions**: Minimal logging, ingen secrets i output

## Edge Functions

- 11 edge functions i `supabase/functions/`
- Alle kræver JWT-verifikation undtagen `admin-reset-password` (dokumenteret undtagelse)
- CORS-headers inkluderet i alle responses
- Service role key bruges kun server-side, aldrig eksponeret til klient

## Sikkerhedsstandarder

- Ingen hardcoded API-nøgler i kildekoden
- Ingen følsom data i konsol-logs (tokens, passwords, e-mails)
- Input-sanitering via `sanitize_text_input()` og `validate_input_security()`
- Rate limiting via `check_rate_limit_security()`
- Filupload begrænset til 20MB
