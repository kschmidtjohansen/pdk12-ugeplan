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
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

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

const renderPlanner = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useOptimizedAssignments('all'), { wrapper });
  await waitFor(() => expect(hook.result.current.assignments.length).toBe(1));
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
