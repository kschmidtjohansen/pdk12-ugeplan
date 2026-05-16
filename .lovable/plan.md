# Plan: Shared realtime channels per table

## Goal
Reduce WebSocket fan-out by sharing a single Supabase Realtime channel per `(schema, table)` pair across all hooks. Each caller registers a postgres_changes listener with a unique key, and unregisters by key. The underlying channel is created on the first subscriber and torn down when the ref-count hits zero.

## New module: `src/lib/realtimeChannels.ts`

Public API:

```ts
type Event = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscribeOptions {
  key: string;                    // unique caller key, used for unsubscribe
  table: string;
  schema?: 'public' | 'demo';     // default 'public'
  event?: Event;                  // default '*'
  filter?: string;                // optional postgres_changes filter
  callback: (payload: any) => void;
}

export function subscribeToTable(opts: SubscribeOptions): () => void;
export function unsubscribeByKey(key: string): void;
export function getActiveChannelStats(): { channels: number; listeners: number };
```

Internals:

- `channels: Map<string, { channel: RealtimeChannel; refCount: number; listeners: Map<string, Listener> }>` keyed by `${schema}:${table}:${event}:${filter ?? ''}`. Filter/event are part of the key because Supabase binds them at `.on()` time and they cannot be re-filtered client-side cheaply for unrelated subscribers.
- `subscribeToTable` looks up the channel by key. If absent, calls `supabase.channel(\`shared:${key}:${nanoid}\`)`, attaches a single `.on('postgres_changes', {...})` handler that fans out to all registered listeners, and calls `.subscribe()`. Otherwise reuses the existing channel and only increments the ref-count.
- Returns an unsubscribe function that decrements refCount, removes the listener, and calls `supabase.removeChannel(...)` when refCount reaches 0.
- DEV-only `console.log` for create/teardown, gated by `import.meta.env.DEV`.
- Errors swallowed with `.message` logging per project error-handling rule.

## Helper for multi-table hooks
Add a small convenience:

```ts
export function subscribeToTables(
  baseKey: string,
  tables: Array<Omit<SubscribeOptions, 'key' | 'callback'> & { table: string }>,
  callback: (table: string, payload: any) => void
): () => void;
```

It registers one listener per table using `${baseKey}:${table}` keys and returns a single combined unsubscribe — needed by hooks like `useUnifiedData` that previously chained multiple `.on()` calls on one channel.

## Hook migrations (scope: `src/hooks/` only)

Replace `supabase.channel(...).on('postgres_changes', ...).subscribe()` + `supabase.removeChannel(...)` with `subscribeToTable` / `subscribeToTables`:

1. `src/hooks/data/useUnifiedData.ts` — `cars`, `profiles` → `subscribeToTables`.
2. `src/hooks/useOptimizedAssignments.ts` — `assignments`, `assignments_employees`.
3. `src/hooks/assignment/useAssignmentDataOptimized.ts` — `assignments`, `assignments_employees`, `profiles`.
4. `src/hooks/assignment/useAssignmentMessages.ts` — `assignment_messages` (keep `filter` on assignment_id).
5. `src/hooks/assignment/useAssignmentFiles.ts` — `assignment_files` (with filter).
6. `src/hooks/car/useCarData.ts` — `cars`.
7. `src/hooks/employee/useEmployeeData.ts` — `profiles`, `user_roles`.
8. `src/hooks/warehouse/useWarehouseData.ts` — `warehouse_items`.
9. `src/hooks/vacation/useVacationRequestsStatus.ts` — `vacations`.
10. `src/hooks/duty/useDutyData.ts` — `on_call_duties`.
11. `src/hooks/duty/useDutySwapRequests.ts` — `duty_swap_requests`.
12. `src/hooks/notifications/notificationRealtime.ts` — notifications table(s) with user-scoped filter.

Each hook will:
- Build a stable `key` like `useUnifiedData:${selectedDepartmentId}` or `useAssignmentMessages:${assignmentId}`.
- Call subscribe in `useEffect`, call the returned unsubscribe in the cleanup.
- Preserve existing debounce timers and "ignore own actions" logic — only the channel layer changes.

## Out of scope (explicitly not touched)
- `src/services/realtimeManager.ts` — keeps its own multi-table abstraction; not used by the listed hooks. Left untouched.
- `src/context/ChangeLogContext.tsx`, `src/components/shared/RealtimeChangeNotifier.tsx`, `src/components/Admin/UserManagement.tsx` — outside `src/hooks/`. Not migrated unless requested.
- Schema for demo mode is preserved (passed through `schema` option).

## Validation
- Type-check via the existing build pipeline.
- Manual smoke: open Planner + Dashboard, confirm realtime updates still arrive, check DEV console for "shared channel created" appearing once per table instead of per hook.
- Verify cleanup by navigating away and back; channel teardown log should fire when last subscriber unmounts.

## Risks
- Filters: two hooks subscribing to the same table with different `filter` strings will still open separate channels (intentional — Supabase server-side filter cannot be merged). Sharing only kicks in for identical `(schema, table, event, filter)` tuples.
- Demo mode uses `schema: 'demo'`; key includes schema so public and demo channels stay isolated.
