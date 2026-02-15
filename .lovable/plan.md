

## Fase 9d: Demo-data isolering via `is_demo` flag

### Overblik

Tilfoej en `is_demo` boolean-kolonne (default `false`) til alle primaere tabeller. Opdater RLS-politikker saa live-brugere ALDRIG ser demo-data. Demo-brugeren skabes med `is_demo = true` paa alle nye poster. Automatisk oprydning via `pg_cron` hvert minut (sletter `is_demo = true` aeldere end 15 minutter). RPC-funktion `reset_demo_data()` til manuel nulstilling.

---

### 1. Database-migration: Tilfoej `is_demo` kolonne

Tabeller der faar kolonnen:

| Tabel | Kolonne | Default |
|-------|---------|---------|
| `assignments` | `is_demo BOOLEAN DEFAULT false` | false |
| `cars` | `is_demo BOOLEAN DEFAULT false` | false |
| `profiles` | `is_demo BOOLEAN DEFAULT false` | false |
| `warehouse_items` | `is_demo BOOLEAN DEFAULT false` | false |
| `vacations` | `is_demo BOOLEAN DEFAULT false` | false |
| `on_call_duties` | `is_demo BOOLEAN DEFAULT false` | false |
| `notifications` | `is_demo BOOLEAN DEFAULT false` | false |
| `assignments_employees` | `is_demo BOOLEAN DEFAULT false` | false |

Eksisterende data settes til `false` via default-vaerdien. Indexes tilfojes paa `is_demo` for hurtigt filter.

### 2. RLS-politikker: Beskytte live-brugere

For ALLE tabeller ovenfor opdateres SELECT-policies med en ekstra betingelse:

```text
-- Eksempel for assignments:
-- Eksisterende policy faar tilfojet:
AND (
  is_demo = false
  OR auth.uid() = '165cdbc9-6722-4c96-97d2-1a87185c8133'
)
```

Logik: `is_demo`-data er KUN synligt for demo-brugeren (ID `165cdbc9...`). Alle andre brugere ser automatisk kun `is_demo = false`.

INSERT-policies for demo-brugeren tillader `is_demo = true`.

### 3. RPC-funktioner

#### `reset_demo_data()`
Sletter alle raekker hvor `is_demo = true` paa tvaers af alle tabeller. Returnerer antal slettede per tabel.

#### `cleanup_demo_data_ttl()`
Sletter raekker hvor `is_demo = true AND created_at < NOW() - INTERVAL '15 minutes'`. Kaldt af pg_cron.

### 4. pg_cron job

Koerer hvert minut:

```text
SELECT cron.schedule(
  'cleanup-demo-data-ttl',
  '* * * * *',
  $$ SELECT reset_demo_ttl_data(); $$
);
```

### 5. Frontend-aendringer

#### Beroorte filer og aendringer

| Fil | Aendring |
|-----|---------|
| `src/hooks/useOptimizedAssignments.ts` | I `createAssignment`: tilfoej `is_demo: true` til payload naar `isDemoMode` |
| `src/hooks/assignment/useAssignmentActions.ts` | I `createAssignment`: tilfoej `is_demo: isDemoMode` til Supabase INSERT |
| `src/hooks/car/useCarData.ts` | I `createCar`: tilfoej `is_demo: true` til Supabase INSERT naar demo |
| `src/hooks/employee/useEmployeeCreation.ts` | I `createUserDirectly` og `createEmployee`: tilfoej `is_demo: true` til profiles INSERT naar demo |
| `src/hooks/warehouse/useWarehouseData.ts` | I `addLocalItem`: tilfoej `is_demo: true` naar demo |
| `src/hooks/vacation/useVacationActions.ts` | I opret-ferie: tilfoej `is_demo: true` naar demo |
| `src/hooks/duty/useDutyActions.ts` | I opret-vagt: tilfoej `is_demo: true` naar demo |
| `src/hooks/employee/useEmployeeData.ts` | I live-mode: tilfoej `.eq('is_demo', false)` til profiles-query |
| `src/hooks/car/useCarData.ts` | I live-mode: filtrering haandteres af RLS, men tilfoej eksplicit `.eq('is_demo', false)` som ekstra sikkerhed |
| `src/hooks/warehouse/useWarehouseData.ts` | I live-mode: tilfoej `.eq('is_demo', false)` |
| `src/hooks/vacation/useVacationData.ts` | I live-mode: tilfoej `.eq('is_demo', false)` via `enhancedDataFetching` |
| `src/services/enhancedDataFetching.ts` | Tilfoej `.eq('is_demo', false)` til alle live-mode queries |
| `src/services/optimizedAssignmentService.ts` | RPC haandterer filtrering; live RPC allerede bag RLS |
| `src/hooks/duty/useDutyData.ts` | I live-mode: tilfoej `.eq('is_demo', false)` |
| `src/hooks/data/useUnifiedData.ts` | I live-mode: tilfoej `.eq('is_demo', false)` via unifiedDataService |
| `src/services/data/unifiedDataService.ts` | Tilfoej `.eq('is_demo', false)` til alle queries |
| `src/hooks/useDemoAutoCleanup.ts` | Brug `reset_demo_data()` RPC i stedet for sessionStorage cleanup |
| `src/constants/demo.ts` | Behold eksisterende; `isDemoNonHomeDepartment` forbliver for afdelingsfiltrering |
| `CHANGELOG.md` | Dokumenter alle aendringer |
| `docs/implementation-plan/tasks.md` | Tilfoej Fase 9d markeret [x] |

### 6. Kvalitetstjek (jf. Knowledge)

- Overholder tekniske specifikationer: RLS-politikker opdateret korrekt
- Ingen foelsom logging tilfojet i produktion
- UI-guidelines upaavirkede (ingen visuelle aendringer)
- Alle aendringer dokumenteres i CHANGELOG.md og implementation-plan
- Live-brugere er 100% beskyttet mod demo-data via baade RLS OG eksplicit query-filtrering (defense in depth)

### 7. Raekkefoelge for implementering

1. Database-migration (tilfoej kolonner + indexes)
2. RLS-politikker (opdater eksisterende + tilfoej demo-specifikke)
3. RPC-funktioner (`reset_demo_data`, `cleanup_demo_data_ttl`)
4. pg_cron job (via SQL INSERT, ikke migration)
5. Frontend hooks (tilfoej `is_demo` til INSERT + `.eq('is_demo', false)` til SELECT)
6. Dokumentation (CHANGELOG + tasks.md)

