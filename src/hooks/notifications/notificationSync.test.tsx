import React from 'react';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import type { AppUser } from '@/context/auth/types';
import { useNotificationFetching } from './notificationFetching';
import { useNotificationRealtime } from './notificationRealtime';
import { useNotificationActions } from './notificationActions';
const mock = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], fail: false, toast: vi.fn(), changed: undefined as undefined | ((p: Record<string, unknown>) => void), connected: undefined as undefined | ((s: string) => void), removed: vi.fn(), eq: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mock.toast }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => { const query = { select: () => query, update: () => query, delete: () => query, order: () => query,
    eq: (...args: unknown[]) => { mock.eq(...args); return query; }, range: async () => ({ data: mock.rows, error: mock.fail ? { message: 'fixture-error' } : null }),
    then: (resolve: (v: unknown) => void) => Promise.resolve({ error: mock.fail ? { message: 'fixture-error' } : null }).then(resolve) }; return query; },
  channel: () => { const channel = { on: (_type: string, _filter: unknown, callback: typeof mock.changed) => { mock.changed = callback; return channel; }, subscribe: (cb: typeof mock.connected) => { mock.connected = cb; return channel; } }; return channel; },
  removeChannel: mock.removed,
} }));
const user = (id: string) => ({ id, role: 'servicemedarbejder' }) as AppUser;
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
beforeEach(() => { mock.rows = [{ id: 'fixture', type: 'assignment', title: 'Fixture', message: 'Test', read: false, created_at: '2026-10-25T10:00:00Z' }]; mock.fail = false; vi.clearAllMocks(); });
afterEach(cleanup);
it('fetches at mount without opening drawer, clears on logout and catches up on focus', async () => {
  const view = renderHook(({ account }) => useNotificationFetching(account), { wrapper, initialProps: { account: user('A') as AppUser | null } });
  await waitFor(() => expect(view.result.current.unreadCount).toBe(1));
  mock.rows = []; act(() => window.dispatchEvent(new Event('focus')));
  await waitFor(() => expect(view.result.current.unreadCount).toBe(0));
  view.rerender({ account: null }); expect(view.result.current.notifications).toEqual([]);
});
it('account switching never exposes previous account rows', async () => {
  const view = renderHook(({ account }) => useNotificationFetching(account), { wrapper, initialProps: { account: user('A') } });
  await waitFor(() => expect(view.result.current.notifications).toHaveLength(1));
  mock.rows = []; view.rerender({ account: user('B') });
  expect(view.result.current.notifications).toEqual([]);
  await waitFor(() => expect(view.result.current.loading).toBe(false));
});
it('realtime dedupes toast per account and refetches UPDATE/reconnect', async () => {
  const catchUp = vi.fn(async () => {});
  const view = renderHook(({ account }) => useNotificationRealtime(account, vi.fn(), vi.fn(), catchUp), { initialProps: { account: user('A') } });
  act(() => { mock.changed?.({ eventType: 'INSERT', new: { id: 'n', user_id: 'A', read: false } }); mock.changed?.({ eventType: 'INSERT', new: { id: 'n', user_id: 'A', read: false } }); });
  expect(mock.toast).toHaveBeenCalledOnce();
  act(() => mock.connected?.('SUBSCRIBED'));
  await waitFor(() => expect(catchUp).toHaveBeenCalled());
  view.rerender({ account: user('B') });
  act(() => mock.changed?.({ eventType: 'INSERT', new: { id: 'n', user_id: 'B', read: false } }));
  expect(mock.toast).toHaveBeenCalledTimes(2);
  expect(mock.removed).toHaveBeenCalled();
});
it('mark/delete are account-scoped and failed mutation preserves local rows', async () => {
  const setRows = vi.fn(), count = vi.fn();
  const view = renderHook(() => useNotificationActions(user('A'), [], setRows, count), { wrapper });
  await act(() => view.result.current.markAsRead('absent'));
  expect(mock.eq).toHaveBeenCalledWith('user_id', 'A'); expect(count).not.toHaveBeenCalled();
  setRows.mockClear(); mock.fail = true;
  await act(() => view.result.current.deleteNotification('fixture'));
  expect(setRows).not.toHaveBeenCalled();
});