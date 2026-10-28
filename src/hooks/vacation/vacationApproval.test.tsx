import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVacationActions } from './useVacationActions';
import { useVacationSecurity } from './useVacationSecurity';
import type { Vacation } from '@/types/vacation';

const mocks = vi.hoisted(() => ({
  auth: { user: { id: 'reviewer', role: 'skadeleder' }, isAdmin: false, isSkadeleder: true, isDemoMode: false, canManageVacations: false, canViewAllVacations: true },
  from: vi.fn(), update: vi.fn(), eq: vi.fn(), notification: vi.fn(), refresh: vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/context/NotificationContext', () => ({ useNotifications: () => ({ addNotification: mocks.notification }) }));
vi.mock('@/utils/securityLogger', () => ({ logSecurityEvent: vi.fn() }));
vi.mock('@/lib/realtimeUtils', () => ({ notifyOwnAction: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('@/integrations/supabase/demoSchemaClient', () => ({ getSchemaClient: () => ({ from: mocks.from }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ not: async () => ({ data: [] }) }) }) }),
  functions: { invoke: vi.fn().mockResolvedValue({ data: null }) },
} }));

const vacation = { id: 'request', user_id: 'employee', status: 'pending', request_type: 'full_day' } as Vacation;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.canManageVacations = false;
  mocks.auth.isAdmin = false;
  mocks.from.mockReturnValue({ update: mocks.update });
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockResolvedValue({ error: null });
});
afterEach(cleanup);

describe('vacation approval action authorization', () => {
  it.each(['approveVacation', 'rejectVacation'] as const)('skadeleder cannot call %s without a grant', async action => {
    const { result } = renderHook(() => useVacationActions(mocks.refresh));
    await act(async () => { expect(await result.current[action](vacation, 'reason')).toBe(false); });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.notification).not.toHaveBeenCalled();
  });
  it.each(['approveVacation', 'rejectVacation'] as const)('explicit approval permission allows %s', async action => {
    mocks.auth.canManageVacations = true;
    const { result } = renderHook(() => useVacationActions(mocks.refresh));
    await act(async () => { expect(await result.current[action](vacation, 'reason')).toBe(true); });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: action === 'approveVacation' ? 'approved' : 'rejected' }));
    expect(mocks.eq).toHaveBeenCalledWith('id', 'request');
  });
  it('admin role does not bypass an explicit approval deny', async () => {
    mocks.auth.isAdmin = true;
    const { result } = renderHook(() => useVacationActions(mocks.refresh));
    await act(async () => { expect(await result.current.approveVacation(vacation)).toBe(false); });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('security status check follows the capability, not the skadeleder role', async () => {
    const { result, rerender } = renderHook(() => useVacationSecurity());
    expect(result.current.canManageVacationStatus()).toBe(false);
    mocks.auth.canManageVacations = true;
    rerender();
    expect(result.current.canManageVacationStatus()).toBe(true);
    await act(async () => { await Promise.resolve(); });
  });
});