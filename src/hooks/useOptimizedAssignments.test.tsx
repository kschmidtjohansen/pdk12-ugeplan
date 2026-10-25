import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- Mocks -----------------------------------------------------------------
const toastMock = vi.fn();
const svc = vi.hoisted(() => ({
  fetchAllAssignments: vi.fn(),
  createAssignment: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  publishAssignment: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'leder@pdk12.dk', role: 'administrator' },
    isAuthenticated: true,
    authReady: true,
  }),
}));
vi.mock('@/context/DepartmentContext', () => ({
  useDepartment: () => ({ selectedDepartmentId: 'dept-12', selectedSubDepartmentId: null }),
}));
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));
vi.mock('@/hooks/employee/useEmployeeData', () => ({ useEmployeeData: () => ({ employees: [] }) }));
vi.mock('@/services/optimizedAssignmentService', () => ({ OptimizedAssignmentService: svc }));
vi.mock('@/services/plannerChangeLogger', () => ({
  PlannerChangeLogger: { logCreate: vi.fn(), logUpdate: vi.fn(), logPublish: vi.fn() },
}));
vi.mock('@/lib/realtimeChannels', () => ({ subscribeToTables: () => () => {} }));
vi.mock('@/lib/realtimeUtils', () => ({ notifyOwnAction: vi.fn() }));
const rpcMock = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: rpcMock } }));

import { useOptimizedAssignments } from './useOptimizedAssignments';

const row = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Sag ${id}`,
  description: '',
  assignment_date: '2026-10-14',
  from_time: '08:00:00',
  to_time: '12:00:00',
  location: 'Ribevej 1',
  published: false,
  case_number: `C-${id}`,
  assignment_employees: [],
  assignment_cars: [],
  created_at: '',
  updated_at: '',
  ...overrides,
});

const renderPlanner = async (expectedCount = 1) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useOptimizedAssignments('all'), { wrapper });
  await waitFor(() => expect(hook.result.current.assignments.length).toBe(expectedCount));
  return hook;
};

const lastUndoAction = () => {
  const call = [...toastMock.mock.calls].reverse().find(c => c[0]?.action);
  return call?.[0].action as React.ReactElement<{ onClick: () => void }>;
};

describe('Ugeplan: opret, ret, slet og fortryd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    svc.fetchAllAssignments.mockResolvedValue([row('a1')]);
  });
  afterEach(() => vi.useRealTimers());

  it('opretter en opgave og sender afdelingen med', async () => {
    svc.createAssignment.mockResolvedValue(row('a2', { title: 'Ny sag' }));
    const { result } = await renderPlanner();

    await act(async () => {
      await result.current.createAssignment({
        title: '  Ny sag ', date: '2026-10-15', fromTime: '08:00', toTime: '10:00', location: 'Asnæs',
      });
    });

    const [payload] = svc.createAssignment.mock.calls[0];
    expect(payload).toMatchObject({ title: 'Ny sag', assignment_date: '2026-10-15', department_id: 'dept-12' });
    expect(result.current.assignments.some(a => a.id === 'a2')).toBe(true);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'planner.assignmentCreated' }));
  });

  it('afviser oprettelse uden titel og gemmer intet', async () => {
    const { result } = await renderPlanner();
    await act(async () => {
      await expect(
        result.current.createAssignment({ title: ' ', date: '2026-10-15', fromTime: '08:00', toTime: '10:00', location: 'X' }),
      ).rejects.toThrow('planner.validation.titleRequired');
    });
    expect(svc.createAssignment).not.toHaveBeenCalled();
  });

  it('retter en opgave og gemmer de nye tider', async () => {
    svc.updateAssignment.mockResolvedValue(undefined);
    const { result } = await renderPlanner();

    await act(async () => {
      await result.current.updateAssignment('a1', {
        title: 'Sag a1', date: '2026-10-14', fromTime: '09:00', toTime: '13:00', location: 'Ribevej 1',
      });
    });

    expect(svc.updateAssignment).toHaveBeenCalledWith(
      'a1', expect.objectContaining({ from_time: '09:00', to_time: '13:00' }), 'leder@pdk12.dk',
    );
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'planner.assignmentUpdated' }));
  });

  it('sletter først efter 5 sekunder', async () => {
    const { result } = await renderPlanner();
    vi.useFakeTimers();

    act(() => { result.current.deleteAssignment('a1'); });
    expect(result.current.assignments).toHaveLength(0);
    expect(svc.deleteAssignment).not.toHaveBeenCalled();

    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(svc.deleteAssignment).toHaveBeenCalledWith('a1', 'leder@pdk12.dk');
  });

  it('Fortryd bringer opgaven tilbage og sletter intet', async () => {
    const { result } = await renderPlanner();
    vi.useFakeTimers();

    act(() => { result.current.deleteAssignment('a1'); });
    expect(result.current.assignments).toHaveLength(0);

    act(() => { lastUndoAction().props.onClick(); });
    expect(result.current.assignments.map(a => a.id)).toEqual(['a1']);

    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(svc.deleteAssignment).not.toHaveBeenCalled();
  });

  it('lægger opgaven tilbage, hvis sletningen fejler', async () => {
    svc.deleteAssignment.mockRejectedValue(new Error('netværk'));
    const { result } = await renderPlanner();
    vi.useFakeTimers();

    act(() => { result.current.deleteAssignment('a1'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });

    expect(result.current.assignments.map(a => a.id)).toEqual(['a1']);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });
});

describe('operationStates – én typesikker kontrakt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    svc.fetchAllAssignments.mockResolvedValue([row('a1')]);
  });
  afterEach(() => vi.useRealTimers());

  it('viser "deleting" under slette-graceperioden og null bagefter', async () => {
    svc.deleteAssignment.mockResolvedValue(undefined);
    const { result } = await renderPlanner();
    vi.useFakeTimers();

    act(() => { result.current.deleteAssignment('a1'); });
    expect(result.current.operationStates['a1']).toBe('deleting');

    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(result.current.operationStates['a1']).toBeNull();
  });

  it('viser "publishing" under publicering og null ved succes', async () => {
    let resolvePublish: () => void = () => {};
    const publishPromise = new Promise<void>((res) => { resolvePublish = res; });
    svc.publishAssignment.mockReturnValue(publishPromise);

    const { result } = await renderPlanner();
    act(() => { void result.current.publishAssignment('a1'); });
    await waitFor(() => expect(result.current.operationStates['a1']).toBe('publishing'));

    await act(async () => { resolvePublish(); await publishPromise; });
    await waitFor(() => expect(result.current.operationStates['a1']).toBeNull());
  });

  it('nulstiller tilstanden efter en opdatering', async () => {
    svc.updateAssignment.mockResolvedValue(undefined);
    const { result } = await renderPlanner();

    await act(async () => {
      await result.current.updateAssignment('a1', {
        title: 'Sag a1', date: '2026-10-14', fromTime: '09:00', toTime: '13:00', location: 'Ribevej 1',
      });
    });

    expect(result.current.operationStates['a1']).toBeNull();
  });
});

describe('Serie-opgaver – alt-eller-intet via RPC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    svc.fetchAllAssignments.mockResolvedValue([
      row('s1', { group_id: 'grp-1' }),
      row('s2', { group_id: 'grp-1', assignment_date: '2026-10-15' }),
    ]);
  });
  afterEach(() => vi.useRealTimers());

  it('serie-sletning bruger én samlet RPC (ingen løkke af enkeltkald)', async () => {
    rpcMock.mockResolvedValue({ data: 2, error: null });
    const { result } = await renderPlanner(2);
    vi.useFakeTimers();

    act(() => { result.current.deleteAssignmentsByGroupId('grp-1'); });
    expect(result.current.assignments).toHaveLength(0);

    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(rpcMock).toHaveBeenCalledWith('delete_assignment_series', { p_group_id: 'grp-1' });
  });

  it('serie-sletning ruller UI tilbage hvis RPC fejler', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'db nede' } });
    const { result } = await renderPlanner(2);
    vi.useFakeTimers();

    act(() => { result.current.deleteAssignmentsByGroupId('grp-1'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });

    expect(result.current.assignments.map((a) => a.id).sort()).toEqual(['s1', 's2']);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('serie-opdatering sender felter og medarbejdere til én RPC', async () => {
    rpcMock.mockResolvedValue({ data: 2, error: null });
    const { result } = await renderPlanner(2);

    await act(async () => {
      await result.current.updateSeriesAssignments('grp-1', {
        title: 'Ny serietitel', fromTime: '08:00', toTime: '12:00', location: 'Ribevej 1',
        employees: ['emp-1', 'emp-2'],
      });
    });

    expect(rpcMock).toHaveBeenCalledWith('update_assignment_series', expect.objectContaining({
      p_group_id: 'grp-1',
      p_employee_ids: ['emp-1', 'emp-2'],
      p_fields: expect.objectContaining({ title: 'Ny serietitel', from_time: '08:00' }),
    }));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'planner.assignmentUpdated' }));
  });

  it('serie-opdatering viser KUN fejl-toast når RPC fejler (aldrig success ved delvis opdatering)', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'delvis fejl' } });
    const { result } = await renderPlanner(2);

    await act(async () => {
      await result.current.updateSeriesAssignments('grp-1', {
        title: 'Ny serietitel', fromTime: '08:00', toTime: '12:00', location: 'Ribevej 1',
      });
    });

    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    expect(toastMock).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'planner.assignmentUpdated' }));
  });
});
