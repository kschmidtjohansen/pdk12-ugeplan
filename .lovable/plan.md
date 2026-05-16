Add a `StatusTimeline` component below the date/time block in `AssignmentDetailsDialog` that lists up to 8 recent `planner_change_log` rows for the current assignment.

### 1. New file: `src/components/Dashboard/StatusTimeline.tsx`

- Client component, props: `assignmentId: string`.
- `useQuery` (React Query, key `['planner_change_log', assignmentId]`, `staleTime: 60_000`) selects from `planner_change_log`:
  ```ts
  supabase.from('planner_change_log')
    .select('id, operation, changed_by_name, change_details, created_at')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false })
    .limit(8)
  ```
- Render a vertical timeline (`<ol className="relative border-l border-border ml-2 space-y-4 pl-4">`). Each item:
  - Absolute-positioned dot (`<span className="absolute -left-[7px] h-3 w-3 rounded-full ring-2 ring-background ${dotColor}" />`).
  - Label = translated action ("Oprettet", "Opdateret", "Publiceret", "Slettet", "Færdiggjort") with fallback to raw `operation`.
  - Relative time via `formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: currentLanguage === 'da' ? da : undefined })`.
  - Actor: `changed_by_name`.
- Dot color map (operation, case-insensitive):
  - `CREATE` → `bg-amber-400`
  - `PUBLISH` / `PUBLISHED` → `bg-primary`
  - `COMPLETE` / `COMPLETED` → `bg-emerald-500`
  - `DELETE` / `DELETED` → `bg-destructive`
  - fallback (e.g. `UPDATE`) → `bg-muted-foreground`
- States:
  - loading → 3 skeleton rows (`bg-muted animate-pulse`).
  - error or empty → hide the section entirely (no entries to show, or RLS blocked).
- Heading matches existing dialog style: `<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('planner.history') ?? 'Historik'}</h4>`.

### 2. `src/components/Dashboard/AssignmentDetailsDialog.tsx`

- Import the new component.
- Inside the left-column content area, after the "Date and Time" block (after line 252 `</div>`), add:
  ```tsx
  <Separator className="my-2" />
  <StatusTimeline assignmentId={assignment.id} />
  ```

### Notes & caveats

- `planner_change_log` RLS SELECT requires `is_admin_or_skadeleder()`. For non-admin users the query returns 0 rows and the component silently renders nothing — confirmed acceptable since the timeline is informational.
- The schema currently logs `CREATE`, `UPDATE`, `DELETE`, `PUBLISH`. There is no `COMPLETED` operation, but `bg-emerald-500` is wired to `COMPLETE`/`COMPLETED` for forward compatibility per the spec.
- No DB migration, no new dependencies — `date-fns` and `@tanstack/react-query` are already in use.

No other files change.