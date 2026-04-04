

## Plan: Custom Right-Click Context Menu on Booking Cards

### Problem
Users must rely on small icon buttons for actions. A right-click context menu provides faster access to Edit, Delete, and Duplicate actions.

### Solution
Wrap `AssignmentCard` and `CompactAssignmentRow` with the existing `ContextMenu` component (already in `src/components/ui/context-menu.tsx`). On right-click, show a styled dropdown with Edit, Delete, and Duplicate options that call the same handlers.

### Changes

| File | Change |
|------|--------|
| `src/components/Planner/AssignmentCard.tsx` | Wrap the `<Card>` in `<ContextMenu>` + `<ContextMenuTrigger>` + `<ContextMenuContent>` with three `<ContextMenuItem>` entries (Edit, Delete, Duplicate). Each calls `onEdit`, `onDelete`, `onCopy` respectively. Add icons (Pencil, Trash2, Copy) to each item. Only show Edit/Delete when `canEdit` is true. |
| `src/components/Planner/CompactAssignmentRow.tsx` | Same pattern but the trigger wraps the `<tr>`. Use `onContextMenu` handler on the `<tr>` to prevent default and trigger a state-controlled context menu (since `<tr>` can't be directly wrapped by ContextMenuTrigger). Alternatively, wrap each row in a ContextMenu with `asChild` on the trigger. |
| `src/translations/da/planner.ts` | Add `contextMenu.edit`, `contextMenu.delete`, `contextMenu.duplicate` keys |
| `src/translations/en/planner.ts` | Same keys in English |
| `CHANGELOG.md` | Document the context menu feature |

### Technical detail — CompactAssignmentRow
The compact row is a `<tr>` inside a `<table>`. Wrapping a `<tr>` in a `<div>` breaks table structure. Instead, use `onContextMenu` on the `<tr>` to manage a custom-positioned menu via Radix's `ContextMenu` with the trigger using `asChild` — or use a simpler approach: render the ContextMenu around the `<tr>` with `ContextMenuTrigger asChild` which renders no wrapper DOM element.

### Context menu items
```text
┌─────────────────┐
│ ✏️  Rediger      │
│ 📋  Dupliker     │
│ ─────────────── │
│ 🗑️  Slet         │  (red text)
└─────────────────┘
```

Only Edit and Delete are gated by `canEdit`. Duplicate is always available if `onCopy` is provided. A separator appears before the destructive Delete action.

