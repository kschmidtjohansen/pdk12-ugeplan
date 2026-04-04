

## Plan: Add `group_id` to Link Multi-Day Assignment Records

### Problem
When a multi-day assignment is created, individual daily records are already generated — but there is no shared identifier linking them as part of the same task.

### Solution
1. Add a `group_id` (UUID, nullable) column to the `assignments` table via migration.
2. When creating a multi-day assignment, generate one `group_id` (via `crypto.randomUUID()`) and write it to all daily records in that batch.
3. Single-day assignments leave `group_id` as `null`.
4. Expose `group_id` in the `Assignment` type so it's available downstream.

### Changes

| File | Change |
|------|--------|
| **Migration** | `ALTER TABLE assignments ADD COLUMN group_id uuid DEFAULT NULL;` — nullable, no FK, indexed for future grouping queries. |
| `src/types/assignment.ts` | Add `groupId?: string` to the `Assignment` interface. |
| `src/hooks/assignment/useAssignmentActions.ts` | In `createAssignment`: generate `const groupId = dates.length > 1 ? crypto.randomUUID() : null;` before the loop, then include `group_id: groupId` in each `.insert()` call. In `updateAssignment`: same logic for the multi-date branch (lines 376-430) — generate a new `groupId` and include it in additional inserts, and update the original record's `group_id` too. |
| `src/utils/assignmentDataConverter.ts` | Map `data.group_id` → `assignment.groupId` in the converter function. |
| `CHANGELOG.md` | Document the new `group_id` column and multi-day linking. |

### Technical details

**Migration SQL:**
```sql
ALTER TABLE public.assignments ADD COLUMN group_id uuid DEFAULT NULL;
CREATE INDEX idx_assignments_group_id ON public.assignments (group_id) WHERE group_id IS NOT NULL;
```

**createAssignment change (line ~64):**
```typescript
const groupId = dates.length > 1 ? crypto.randomUUID() : null;
```
Then in the insert object (line ~112-128), add:
```typescript
group_id: groupId,
```

**updateAssignment change (line ~376):**
When creating additional assignments for extra dates, generate a shared `groupId`, update the original record's `group_id`, and include it in each new insert.

No RLS changes needed — `group_id` is a data column, not an access control column.

