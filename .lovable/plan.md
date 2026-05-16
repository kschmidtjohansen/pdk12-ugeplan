## NotificationsDrawer (slide-in from right)

Replace the existing bell dropdown with a Radix `Sheet` drawer that shows the full notification history with date grouping and infinite scroll.

### What will be built

**1. New component** `src/components/Layout/NavComponents/NotificationsDrawer.tsx`
- Uses `Sheet` / `SheetContent` from `@/components/ui/sheet` with `side="right"` (`w-full sm:max-w-md`).
- Trigger = the existing bell button (with unread badge), so it visually replaces the dropdown trigger inside `AppTopBar`.
- Header (sticky): "Notifikationer" title, `Marker alle som læst` button (disabled when no unread), `SheetClose` X (auto from Sheet).
- Body: scrollable list grouped into "I dag", "Denne uge", "Tidligere" using `date-fns` `isToday` and `isThisWeek({ weekStartsOn: 1 })`. Group headers in small uppercase text-muted-foreground.
- Each row: 
  - coloured dot (h-2 w-2 rounded-full): `bg-primary` if unread, `bg-muted` if read
  - title (bold) + message (text-sm muted)
  - relative time via `formatDistanceToNow(..., { addSuffix: true, locale: da })`
  - delete button (Trash icon, ghost) on the right
- Click row → calls `markAsRead(id)`, then navigates to `notification.link` if present, closes the sheet.

**2. Infinite scroll**
- Local `useInfiniteQuery` inside the drawer:
  - queryKey: `['notifications', 'infinite', userId]`
  - pageSize: 20
  - fetcher: `supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).range(from, to)`
  - `getNextPageParam`: returns `pages.flat().length` if last page had 20, else `undefined`
- Sentinel `<div ref>` at the bottom uses `IntersectionObserver` to call `fetchNextPage()`.
- Loading skeletons (4 rows) while initial fetching; "Indlæser…" while fetching next page; empty state when zero notifications.

**3. Mutations**
- Reuse the existing `useNotifications()` context functions: `markAsRead`, `markAllAsRead`, `deleteNotification`. They update Supabase + local context state. After mutation, also call `queryClient.invalidateQueries({ queryKey: ['notifications', 'infinite', userId] })` so the drawer list refreshes.
- The bell badge in the trigger keeps using `unreadCount` from context (unchanged behaviour).

**4. Wire into `AppTopBar.tsx`**
- Replace `<NotificationsDropdown ... />` with `<NotificationsDrawer />`.
- Remove the props plumbing (drawer reads context internally). `notifications.slice(0,10)` from context becomes unused for this widget — keep context as-is since other places may use it.

### Out of scope
- No schema or RLS changes (the `notifications` table already supports user-scoped reads/updates).
- `NotificationsDropdown.tsx` and `NotificationsList.tsx` stay in the repo for now (not deleted) in case they're imported elsewhere; can be removed later.
- No changes to realtime subscription behaviour.

### Files changed
- `src/components/Layout/NavComponents/NotificationsDrawer.tsx` (new)
- `src/components/Layout/AppTopBar.tsx`
