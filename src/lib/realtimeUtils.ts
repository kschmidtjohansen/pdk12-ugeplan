/**
 * Realtime / refresh utilities.
 *
 * `notifyOwnAction` dispatches a window event that the global
 * `RealtimeChangeNotifier` listens for. When fired, the notifier
 * suppresses its "Der er sket ændringer" banner for ~3 seconds so
 * that the user's own mutations don't trigger a noisy refresh prompt.
 *
 * Call this on the success path of any mutation hook
 * (assignments, employees, cars, vacations, duty, warehouse, …).
 */
export function notifyOwnAction(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event('supabase-own-action'));
  } catch {
    // ignore — dispatchEvent rarely throws but never let it break a mutation
  }
}
