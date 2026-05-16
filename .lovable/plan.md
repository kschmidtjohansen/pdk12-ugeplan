# Plan: Virtualize long day-sections in default Planner view

## Goal
For the default (non-compact, non-grid) Planner view, virtualize the list of `AssignmentCard`s inside any day that holds more than 12 assignments. Compact and Grid views stay as direct rendering.

## Scope
- Only the card list inside `DaySection` (default variant). Header, publish button, `DayAbsenceRow`, and `EmptyDayCTA` remain outside the virtualizer.
- Threshold: `assignments.length > 12`.
- Virtualizer config: `estimateSize: () => 88`, `overscan: 3`.
- Keep `React.memo` on `AssignmentCard` (already in place — line 274).

## Notes on existing infrastructure
- `@tanstack/react-virtual` is **already installed** (used by `src/components/Planner/VirtualList.tsx`). No new dependency needed — install step in the request is a no-op we can skip / confirm.
- Existing `VirtualList` uses `useWindowVirtualizer` at day-section granularity (10+ days). We are adding a second, inner virtualization layer for cards within a single day, using `useVirtualizer` with a scoped scroll parent (window scroll).

## Changes

### 1. `src/components/Planner/DaySection.tsx`
- Import `useWindowVirtualizer` from `@tanstack/react-virtual` and `useRef`.
- When `gridLayout === false` AND `dayAssignments.length > 12`, render the cards through a virtualizer:
  - `count: dayAssignments.length`
  - `estimateSize: () => 88`
  - `overscan: 3`
  - `getItemKey: (i) => dayAssignments[i].id`
  - `scrollMargin: parentRef.current?.offsetTop ?? 0`
  - Use `measureElement` ref on each row to handle taller cards.
- For `gridLayout === true` (grid view inside default mode) keep current direct rendering.
- For `dayAssignments.length <= 12` keep current direct rendering.
- `EmptyDayCTA` branch unchanged.

### 2. Compact + Grid views — unchanged
- `CompactCurrentAndFutureDays` / `CompactPastAssignments`: untouched.
- Grid layout branch in `DaySection` (`gridLayout=true`): untouched.

### 3. `AssignmentCard`
- No changes — already `React.memo`-wrapped.

### 4. Documentation
- `CHANGELOG.md`: add entry under Performance — "Virtualize day sections with >12 assignments using @tanstack/react-virtual (estimateSize 88, overscan 3)".
- `docs/implementation-plan/tasks.md`: add matching `[x]` entry.

## Out of scope
- Compact view virtualization.
- Grid view virtualization.
- Changes to outer day-list virtualization in `CurrentAndFutureDays`.
- Any business-logic changes.

## Verification
- Open Planner in default view on a week with >12 assignments in one day → cards render, scrolling smooth, no layout shift between rows, expand/collapse still works.
- Days with ≤12 assignments still render directly (no absolute positioning).
- Compact and grid views unchanged.
