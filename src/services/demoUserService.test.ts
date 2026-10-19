import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression test: cleanup must call cleanup_session_data through the bound
// Supabase client. Extracting supabase.rpc into a plain variable drops `this`
// and the real client throws, so demo data was never cleared on logout.

interface MockedSupabase {
  rest: { rpc: ReturnType<typeof vi.fn> };
  rpc: (this: MockedSupabase, fn: string, args?: Record<string, unknown>) => Promise<unknown>;
}

const holder = vi.hoisted(() => ({ supabase: null as unknown as MockedSupabase }));

vi.mock('@/integrations/supabase/client', () => {
  const supabase = {
    rest: { rpc: vi.fn(async () => ({ data: [{ deleted_assignments: 2 }], error: null })) },
    // Mirrors the real SupabaseClient.rpc: forwards via this.rest
    rpc(fn: string, args?: Record<string, unknown>) {
      return this.rest.rpc(fn, args);
    },
  };
  holder.supabase = supabase as MockedSupabase;
  return { supabase };
});

import { DemoUserService } from './demoUserService';

describe('DemoUserService.cleanupAllDemoUserData', () => {
  beforeEach(() => {
    sessionStorage.clear();
    holder.supabase.rest.rpc.mockClear();
    sessionStorage.setItem('demo-assignments', JSON.stringify([{ id: 'a1' }]));
    sessionStorage.setItem('demo-cars', JSON.stringify([{ id: 'c1' }]));
    sessionStorage.setItem('demo-operations', JSON.stringify([]));
  });

  it('kalder cleanup_session_data via klienten og rydder lokalt demo-data', async () => {
    const svc = DemoUserService.getInstance();

    const result = await svc.cleanupAllDemoUserData();

    expect(holder.supabase.rest.rpc).toHaveBeenCalledWith('cleanup_session_data', {
      baseline_timestamp: '2024-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
    expect(result.deletedCounts.assignments).toBe(2);
    expect(sessionStorage.getItem('demo-assignments')).toBeNull();
    expect(sessionStorage.getItem('demo-cars')).toBeNull();
    expect(sessionStorage.getItem('demo-operations')).toBe('[]');
  });

  it('rapporterer fejl uden at kaste, hvis RPC-kaldet fejler', async () => {
    holder.supabase.rest.rpc.mockRejectedValueOnce(new TypeError('Cannot read properties of undefined'));
    const svc = DemoUserService.getInstance();

    const result = await svc.cleanupAllDemoUserData();

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
