// Execute the actual messaging worker with isolated browser/IDB/network mocks.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';
function worker(values: Map<string, unknown>, response = { ok: true, updated: true }) {
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  const fetch = vi.fn(async (_url: string, _options: { body: string }) => ({ ok: response.ok, json: async () => ({ updated: response.updated }) }));
  const subscription = { endpoint: 'https://push.invalid/new', toJSON: () => ({ keys: { p256dh: 'fixture-key', auth: 'fixture-auth' } }) };
  const db = { close: vi.fn(), transaction: () => {
    const tx = { oncomplete: () => {}, onerror: () => {}, onabort: () => {}, objectStore: () => ({
      get: (key: string) => { const req = { result: values.get(key), onsuccess: () => {} }; queueMicrotask(() => { req.onsuccess(); }); return req; },
      put: (value: unknown, key: string) => { values.set(key, value); }, delete: (key: string) => values.delete(key),
    }) };
    setTimeout(() => tx.oncomplete(), 0); return tx;
  } };
  const indexedDB = { open: () => { const req = { result: db, onsuccess: () => {}, onerror: () => {} }; queueMicrotask(() => req.onsuccess()); return req; } };
  const self = { addEventListener: (name: string, fn: (e: Record<string, unknown>) => void) => listeners.set(name, fn), location: { origin: 'https://polyplan.invalid' },
    registration: { pushManager: { subscribe: vi.fn(async () => subscription) }, showNotification: vi.fn() }, clients: { matchAll: async () => [], openWindow: vi.fn() } };
  runInNewContext(readFileSync('public/push-sw.js', 'utf8'), { self, indexedDB, fetch, URL, Uint8Array });
  const rotate = async (old = 'https://push.invalid/old') => {
    let pending: Promise<void> = Promise.resolve();
    listeners.get('pushsubscriptionchange')?.({ oldSubscription: { endpoint: old }, newSubscription: subscription, waitUntil: (p: Promise<void>) => { pending = p; } });
    await pending;
  };
  return { rotate, fetch, self, listeners };
}
it('sends only exact old-endpoint ownership token and commits rotation together', async () => {
  const values = new Map<string, unknown>([['resubscribe:https://push.invalid/old', 'fixture-token'], ['latest', { userId: 'fixture-user' }]]);
  const w = worker(values); await w.rotate();
  expect(JSON.parse(w.fetch.mock.calls[0]?.[1]?.body ?? '{}')).toMatchObject({ old_endpoint: 'https://push.invalid/old', resubscribe_token: 'fixture-token' });
  expect(values.has('resubscribe:https://push.invalid/old')).toBe(false);
  expect(values.get('resubscribe:https://push.invalid/new')).toBe('fixture-token');
  expect(values.get('latest')).toMatchObject({ userId: 'fixture-user', endpoint: 'https://push.invalid/new' });
});
it('never falls back to a token for another endpoint', async () => {
  const w = worker(new Map([['latest', { endpoint: 'other', token: 'wrong-token' }]]));
  await w.rotate(); expect(w.fetch).not.toHaveBeenCalled();
});
it.each([{ ok: false, updated: false }, { ok: true, updated: false }])('preserves recovery on rejected or no-op server rotation', async response => {
  const values = new Map<string, unknown>([['resubscribe:https://push.invalid/old', 'fixture-token']]);
  await worker(values, response).rotate();
  expect(values.get('resubscribe:https://push.invalid/old')).toBe('fixture-token');
  expect(values.has('resubscribe:https://push.invalid/new')).toBe(false);
});
it('restricts notification clicks to internal app routes', async () => {
  const w = worker(new Map()); let pending = Promise.resolve();
  w.listeners.get('notificationclick')?.({ notification: { close: vi.fn(), data: { link: '//evil.invalid' } }, waitUntil: (p: Promise<void>) => { pending = p; } });
  await pending; expect(w.self.clients.openWindow).toHaveBeenCalledWith('https://polyplan.invalid/dashboard');
});