/* eslint-disable no-control-regex -- Reject ASCII control characters in untrusted URLs. */
/** Never allow notification payloads to navigate outside the app's routes. */
export function safeNotificationLink(link?: string | null): string | null {
  if (!link || !link.startsWith('/') || link.startsWith('//') || /[\\\u0000-\u0020]/.test(link)) return null;
  const url = new URL(link, 'https://polyplan.invalid');
  const roots = ['dashboard', 'planner', 'employees', 'cars', 'vacation', 'vacations', 'duty', 'warehouse', 'admin', 'profile', 'notifications'];
  if (url.origin !== 'https://polyplan.invalid' || !roots.includes(url.pathname.split('/')[1])) return null;
  return url.pathname + url.search + url.hash;
}

export function deliveryCounts(c: { total_recipients: number; push_sent: number; push_failed: number; push_skipped_preference: number; push_no_subscription: number }) {
  return { inbox: c.total_recipients, accepted: c.push_sent, failed: c.push_failed,
    optedOut: c.push_skipped_preference, noSubscription: c.push_no_subscription,
    pending: Math.max(0, c.total_recipients - c.push_sent - c.push_failed - c.push_skipped_preference - c.push_no_subscription) };
}