import { expect, it } from 'vitest';
import { safeNotificationLink, deliveryCounts } from './notificationDelivery';
it('rejects external, protocol-relative, backslash and unknown links', () => {
  for (const link of ['https://evil.test', '//evil.test', '/\\evil.test', '/unknown', 'javascript:alert(1)']) expect(safeNotificationLink(link)).toBeNull();
  expect(safeNotificationLink('/planner?week=53&year=2026')).toBe('/planner?week=53&year=2026');
});
it('separates inbox, provider acceptance, opt-out, missing devices and failures', () => {
  expect(deliveryCounts({ total_recipients: 10, push_sent: 3, push_failed: 2, push_skipped_preference: 1, push_no_subscription: 2 }))
    .toEqual({ inbox: 10, accepted: 3, failed: 2, optedOut: 1, noSubscription: 2, pending: 2 });
});