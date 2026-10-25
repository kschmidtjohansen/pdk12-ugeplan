import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { saveSubscription, usePushNotifications } from './usePushNotifications';
const state = vi.hoisted(() => ({ userId: 'fixture-user' as string | null, fail: false, upsert: vi.fn(), subscribed: vi.fn() }));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ t: (s: string) => s }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: state.userId ? { id: state.userId } : null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) },
  from: () => { const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: null, error: null }), upsert: async (row: unknown) => { state.upsert(row); return { error: state.fail ? { message: 'fixture' } : null }; } }; return q; },
} }));
const subscription = { endpoint: 'https://push.invalid/fixture', toJSON: () => ({ keys: { p256dh: 'fixture', auth: 'fixture' } }), getKey: () => null } as unknown as PushSubscription;
beforeEach(() => {
  state.userId = 'fixture-user'; state.fail = false; vi.clearAllMocks(); localStorage.clear();
  vi.stubGlobal('Notification', { permission: 'granted', requestPermission: async () => 'granted' });
  vi.stubGlobal('PushManager', function () {});
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { getRegistration: async () => ({ active: {}, pushManager: { getSubscription: async () => subscription } }) } });
  vi.stubGlobal('indexedDB', { open: () => {
    const req = { result: { close: vi.fn(), transaction: () => {
      const tx = { oncomplete: () => {}, objectStore: () => ({ put: vi.fn(), get: () => { const r = { result: undefined, onsuccess: () => {} }; queueMicrotask(() => r.onsuccess()); return r; } }) };
      setTimeout(() => tx.oncomplete(), 0); return tx;
    } }, onsuccess: () => {} }; queueMicrotask(() => req.onsuccess()); return req;
  } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('authenticated persistence failure cannot produce on despite existing local subscription', async () => {
  state.fail = true;
  const view = renderHook(() => usePushNotifications());
  await waitFor(() => expect(view.result.current.status).toBe('error'));
  expect(state.upsert).toHaveBeenCalled();
});
it('only successful authenticated persistence and worker storage enable on', async () => {
  const view = renderHook(() => usePushNotifications());
  await waitFor(() => expect(view.result.current.status).toBe('on'));
});
it('signed-out or mismatched account never writes a subscription', async () => {
  state.userId = null;
  expect(await saveSubscription(subscription)).toBe(false);
  state.userId = 'other-user';
  expect(await saveSubscription(subscription, 'expected-user')).toBe(false);
  expect(state.upsert).not.toHaveBeenCalled();
});