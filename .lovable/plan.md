

## Fase 10b: Luk de 6 resterende sikkerhedsfund

### Status

Tre fund er allerede rettet (CRON_SECRET, storage policy, search_path) men ikke alle er markeret korrekt i panelet. Tre har stadig aktive kodeproblemer eller mangler ignore-begrundelse.

---

### Trin 1: Fix uguardede console-statements (3 filer)

**Fil: `src/integrations/supabase/client.ts`** (linje 29, 34, 52)
- Wrap `console.error('Session validation error:' ...)` i DEV-guard
- Wrap `console.error('Session validation failed:' ...)` i DEV-guard
- Wrap `console.warn(operationName attempt ...)` i DEV-guard

**Fil: `src/components/Auth/SecurityHeaders.tsx`** (linje 61)
- Wrap `console.warn('[Security] Potential security issue ...')` i DEV-guard

**Fil: `src/hooks/assignment/useAssignmentFiles.ts`** (linje 494, 508)
- Wrap `console.warn('[useAssignmentFiles] Storage deletion ...')` i DEV-guard
- Wrap `console.error('[useAssignmentFiles] Error deleting ...')` i DEV-guard

### Trin 2: Opdater sikkerhedspanelet

Marker foelgende findings:

1. **`definer_no_search_path`** - Slet finding (allerede rettet i migration med SET search_path = public)
2. **`console_prod_logging`** - Slet finding (rettet i trin 1)
3. **`demo_pass_in_migrations`** - Marker ignoreret: "Demo-kontoen er isoleret med RESTRICTIVE RLS og 15-min TTL. Passwordet giver kun adgang til sandboxed demo-data der slettes automatisk."
4. **`chart_dangerous_html`** - Marker ignoreret: "shadcn/ui bibliotekskode. Data stammer fra interne THEMES-konstanter, ikke brugerinput. Ingen XSS-risiko."

### Trin 3: Dokumentation

- Opdater `CHANGELOG.md` med sikkerhedsrettelserne
- Opdater `docs/implementation-plan/tasks.md` med afsluttet Fase 10

### Resultat

Sikkerhedspanelet vil have:
- 0 errors
- 0 warnings
- 2 ignorerede infos (med begrundelse)

