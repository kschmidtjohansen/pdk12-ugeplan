
## Fase 3: Performance og Hastighed

### Problem-analyse

Tre hovedproblemer identificeret:

1. **Ingen TanStack Query caching paa assignments**: `useOptimizedAssignments` bruger `useState`/`useEffect` i stedet for `useQuery`, saa data genindlaeses ved hvert mount/tab-skift
2. **Overdrevne realtime-kanaler**: 5-6 separate Supabase channels abonnerer paa de samme tabeller (f.eks. `assignments` har 3 kanaler: `optimized-assignments-realtime`, `unified-data-changes`, `assignment_changes_optimized`)
3. **100+ uguardede `console.log`** i `usePlannerPage.ts`, `realtimeManager.ts`, `optimizedAssignmentService.ts` (korer i produktion)

### Plan

#### 1. Wrap `useOptimizedAssignments` i TanStack Query

**Fil**: `src/hooks/useOptimizedAssignments.ts`

Erstatter `useState`/`useEffect`-baseret datahentning (linje 103-189, 838-842) med `useQuery`:
- `queryKey: ['assignments', user?.id, filter, selectedDepartmentId, selectedSubDepartmentId]`
- `staleTime: 5 * 60 * 1000` (5 min, matcher QueryClient default)
- `gcTime: 10 * 60 * 1000` (10 min)
- Bevarer optimistisk UI i mutations (create/update/delete bruger `setQueryData` i stedet for `setAssignments`)
- Realtime-kanal trigger `queryClient.invalidateQueries` i stedet for fuld refetch
- **Resultat**: Tab-skift viser cached data oejeblikkeligt (stale-while-revalidate)

#### 2. Konsolider duplikerede realtime-kanaler

**Problem**: `assignments`-tabellen har 3 separate kanaler:
- `optimized-assignments-realtime` (useOptimizedAssignments)
- `unified-data-changes` (useUnifiedData)
- `assignment_changes_optimized` (useAssignmentDataOptimized)

Desuden abonnerer `profiles` paa 3 separate kanaler.

**Handling** i `src/hooks/data/useUnifiedData.ts`:
- Fjern `assignments`-lytter fra `unified-data-changes` kanalen (allerede daekket af useOptimizedAssignments)
- Bevar kun `cars` og `profiles` i denne kanal

**Handling** i `src/hooks/useOptimizedAssignments.ts`:
- Tilfoej ogsaa lytning paa `assignments_employees`-tabellen i den eksisterende kanal (saa vi fanger medarbejder-tildelinger)

#### 3. DEV-guard paa 100+ console.log

| Fil | Antal uguardede console.log |
|-----|-----------------------------|
| `src/hooks/usePlannerPage.ts` | 15 stk |
| `src/services/realtimeManager.ts` | 11 stk |
| `src/services/optimizedAssignmentService.ts` | ~30 stk |

**Handling**: Wrap alle i `if (import.meta.env.DEV)` guard. `console.error` og `console.warn` bevares (fejlhaandtering).

#### 4. Profilmenu: Vis jobtitel i stedet for rolle-ID

**Fil**: `src/components/Layout/NavComponents/UserMenu.tsx`

Visning i profilmenuen viser aktuelt den tekniske rolle-ID (f.eks. `skadeleder`). Erstat med `user.jobTitle` eller et oversat rollenavn for bedre brugervenlighed.

---

### Samlet filplan

| Fil | Handling |
|-----|---------|
| `src/hooks/useOptimizedAssignments.ts` | Migrer til useQuery + tilfoej assignments_employees lytning + DEV-guard |
| `src/hooks/usePlannerPage.ts` | DEV-guard paa 15 console.log + fjern verbose assignment-detaljer logging |
| `src/services/realtimeManager.ts` | DEV-guard paa 11 console.log |
| `src/services/optimizedAssignmentService.ts` | DEV-guard paa ~30 console.log |
| `src/hooks/data/useUnifiedData.ts` | Fjern assignments-lytter fra realtime-kanal |
| `src/components/Layout/NavComponents/UserMenu.tsx` | Vis jobtitel i stedet for teknisk rolle-ID |
| `docs/implementation-plan/tasks.md` | Tilfoej Fase 3 med opgaver markeret [x] |
| `CHANGELOG.md` | Dokumenter performance-forbedringer |

### Hvad der IKKE aendres

- Mutation-logik (create/update/delete) bevarer optimistisk UI
- Realtime forbliver intakt (kun konsolidering, ingen fjernelse)
- Fil-upload og billeder i opgaver paavirkes ikke (allerede lazy-loaded via Supabase Storage URLs)
- Ingen aendringer af database-struktur eller RLS-politikker
