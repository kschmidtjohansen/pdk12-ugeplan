

## Fase 9d (fix): Demo-schema routing + resterende DemoUserService-migrering

### Problem

`demoSchemaClient.ts` dirigerer stadig queries til `demo`-schemaet naar `isDemoMode=true` (linje 20-21). Men `is_demo`-kolonnen og RESTRICTIVE RLS-politikker er oprettet i `public`-schemaet. Dette foraarsager fejl ved oprettelse af biler, lager, medarbejdere osv. i demo-mode, fordi `demo`-schemaets tabeller ikke har `is_demo`-kolonnen.

Derudover bruger `useAssignmentActions.ts` og `useEmployeeActions.ts` stadig `DemoUserService` (sessionStorage) til visse operationer, og `useAssignmentDataOptimized.ts` merger stadig fra sessionStorage.

### Sikring af Live-data

**Defense in depth** -- tre lag beskytter live-brugere:

1. **RESTRICTIVE RLS-politikker** (allerede aktive): `is_demo = false OR auth.uid() = demo-user-id` paa alle 8 tabeller. Live-brugere kan ALDRIG se `is_demo = true` raekker, uanset hvad frontend goer.
2. **Eksplicit query-filtrering**: `.eq('is_demo', false)` i alle live-mode data-hooks (allerede implementeret i forrige fase).
3. **Realtime subscriptions**: Skal lytte paa `public` schema (ikke `demo`) -- dette fixes i denne opdatering.

---

### 1. Fix `demoSchemaClient.ts` -- stop demo-schema routing

**Fil**: `src/integrations/supabase/demoSchemaClient.ts`

Aendr `from()` metoden saa den ALTID returnerer `public`-schema klienten. `demo`-schemaet bruges ikke laengere, da `is_demo`-flaget nu haandterer isolering i `public`-schemaet.

```text
from(table: string) {
  // All operations now use public schema with is_demo flag for isolation
  return supabase.from(table as any);
}
```

Dette fixer ALLE eksisterende kald paa en gang uden at aendre hver fil individuelt.

### 2. Fix `useAssignmentActions.ts` -- fjern DemoUserService

**Fil**: `src/hooks/assignment/useAssignmentActions.ts`

| Blok | Nuvaerende | Ny |
|------|-----------|-----|
| Create (linje 83-122) | `demoService.storeDemoAssignment()` med fake ID | Brug `getSchemaClient` + `.insert({ ...data, is_demo: true })` (som non-demo blokken allerede goer) |
| Update (linje 348-394) | `demoService.updateDemoAssignment()` | Brug `getSchemaClient` + `.update()` (genbrug non-demo logikken) |
| Publish (linje 637-653) | `demoService.updateDemoAssignment()` | Brug `getSchemaClient` + `.update({ published: true })` |
| PublishByDate (linje 690-710) | `sessionStorage.setItem()` | Brug `getSchemaClient` + `.update({ published: true }).eq('assignment_date', date)` |

Fjern `DemoUserService`-import (linje 10) og `demoService`-variabel (linje 22).

### 3. Fix `useEmployeeActions.ts` -- fjern DemoUserService

**Fil**: `src/hooks/employee/useEmployeeActions.ts`

| Blok | Nuvaerende | Ny |
|------|-----------|-----|
| toggleEmployeeLeave (linje 26-44) | `DemoUserService.updateDemoEmployee()` | Brug `getSchemaClient` + `.update()` paa `profiles` |
| updateEmployee (linje 96-119) | `DemoUserService.updateDemoEmployee()` | Brug `getSchemaClient` + `.update()` paa `profiles` |
| deleteEmployee (linje 203-213) | `DemoUserService.deleteDemoEmployee()` | Brug `getSchemaClient` + `.delete().eq('id', id).eq('is_demo', true)` |

Fjern `DemoUserService`-import (linje 9).

### 4. Fix `useAssignmentDataOptimized.ts` -- fjern local-merge + fix realtime

**Fil**: `src/hooks/assignment/useAssignmentDataOptimized.ts`

- **Fjern sessionStorage-merge** (linje 101-123): RLS returnerer allerede `is_demo`-data til demo-brugeren. Ingen local-merge noedvendig.
- **Fix realtime subscription** (linje 175, 193): Aendr `schema: isDemoMode ? 'demo' : 'public'` til `schema: 'public'` -- al data er nu i public schema.
- Fjern `DemoUserService`-import (linje 10) og `demoService`-variabel (linje 20).

### 5. Fix `useEmployeeData.ts` -- fjern local-merge

**Fil**: `src/hooks/employee/useEmployeeData.ts`

- Fjern `DemoUserService`-import og `demoService`-variabel.
- Fjern local-merge af `demoService.getDemoEmployees()` (linje 67-88 i demo-blokken). RPC returnerer allerede `is_demo`-data via RLS.

### 6. Forenkl `useDemoTracking.ts`

**Fil**: `src/hooks/useDemoTracking.ts`

- Erstat `DemoUserService` cleanup med `reset_demo_data` RPC.
- Fjern sessionStorage-baseret tracking (ikke laengere relevant da alt er i DB).
- Behold activity-tracking for UX (valgfrit).

### 7. Logging-oprydning (jf. Knowledge)

Paa tvaers af alle beroorte filer:

| Fil | Antal uguardede `console.log` | Handling |
|-----|-------------------------------|---------|
| `useAssignmentActions.ts` | ~20 (linje 65-66, 72, 84, 116-119, 154, 171, 176, 209, 228, 293, 319, 322, 338-339, 345, 349, 390, 400, 530, 606, 638, 691) | Wrap i `import.meta.env.DEV` |
| `useAssignmentDataOptimized.ts` | ~10 (linje 27, 37, 40, 122, 125, 156, 176, 194, 201, 212) | Wrap i `import.meta.env.DEV` |
| `useEmployeeActions.ts` | 3 (linje 20, 84, 200) | Wrap i `import.meta.env.DEV` |
| `useCarActions.ts` | ~6 (linje 57, 108, 137, 227, 237, 256) | Wrap i `import.meta.env.DEV` |

`console.error` beholdes for fejlhaandtering. Ingen foelsom data (bruger-ID, email, passwords) logges.

### 8. Dokumentation

- Opdater `CHANGELOG.md` med beskrivelse af fix og DemoUserService-migrering.

### Raekkefoelge

1. `demoSchemaClient.ts` -- stop demo-schema routing (fixer alle DB-kald paa en gang)
2. `useAssignmentActions.ts` -- fjern DemoUserService, brug DB
3. `useEmployeeActions.ts` -- fjern DemoUserService, brug DB
4. `useAssignmentDataOptimized.ts` -- fjern local-merge, fix realtime schema
5. `useEmployeeData.ts` -- fjern local-merge
6. `useDemoTracking.ts` -- forenkl til RPC
7. Logging-oprydning paa tvaers af alle filer
8. `CHANGELOG.md`

### Live-data beskyttelse (opsummering)

- **RLS**: RESTRICTIVE policies paa alle 8 tabeller -- live-brugere ser KUN `is_demo = false`
- **Query-filtrering**: `.eq('is_demo', false)` i alle live-mode hooks (defense in depth)
- **Realtime**: Lytter paa `public` schema -- ingen data fra `demo` schema laeser ind
- **pg_cron**: Sletter automatisk `is_demo = true` data aeldre end 15 minutter
- **Ingen demo-schema**: Al routing til `demo`-schemaet fjernes -- ingen risiko for data-laekning mellem schemaer

