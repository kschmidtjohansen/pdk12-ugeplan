import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
const refreshSession = vi.fn().mockResolvedValue({});
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a), auth: { getSession: vi.fn().mockResolvedValue({}), refreshSession } },
}));

import { rpcWithRefresh, isJwtExpiredError } from './safeRpc';

describe('rpcWithRefresh (session flow)', () => {
  beforeEach(() => { rpc.mockReset(); refreshSession.mockClear(); });
  it('returns data on success', async () => {
    rpc.mockResolvedValue({ data: 5, error: null });
    expect(await rpcWithRefresh<number>('fn')).toEqual({ data: 5, error: null });
    expect(refreshSession).not.toHaveBeenCalled();
  });
  it('refreshes and retries once on expired JWT', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'JWT expired' } })
       .mockResolvedValueOnce({ data: 'ok', error: null });
    const r = await rpcWithRefresh<string>('fn', { a: 1 });
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(r.data).toBe('ok');
  });
  it('does not retry on other errors', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    const r = await rpcWithRefresh('fn');
    expect(rpc).toHaveBeenCalledOnce();
    expect(r.error?.message).toBe('permission denied');
  });
  it('detects jwt errors', () => expect(isJwtExpiredError({ message: 'invalid JWT signature' })).toBe(true));
});
