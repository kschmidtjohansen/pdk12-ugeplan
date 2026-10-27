import React from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Assignment } from '@/types/assignment';
import PlannerCalendarView from './PlannerCalendarView';

const captured = vi.hoisted(() => ({ props: {} as Record<string, (event: unknown) => unknown>, warning: vi.fn() }));
vi.mock('sonner', () => ({ toast: { warning: captured.warning } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'one' } }) }));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ currentLanguage: 'da', t: (key: string) => key }) }));
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual<typeof import('@dnd-kit/core')>('@dnd-kit/core');
  return { ...actual, DndContext: ({ children, ...props }: React.PropsWithChildren<Record<string, (event: unknown) => unknown>>) => { captured.props = props; return <>{children}</>; }, DragOverlay: ({ children }: React.PropsWithChildren) => <>{children}</> };
});
const task: Assignment = { id: 'task', title: 'Task', date: '2026-12-28', location: 'Address', fromTime: '08:00', toTime: '10:00', published: true, employees: ['one'] };
const employees = ['one', 'two'].map(id => ({ id, name: id, email: '', role: 'servicemedarbejder' as const, status: 'active' as const }));
beforeEach(() => {
  captured.warning.mockClear();
  localStorage.setItem('plannerCalendarEmployees', JSON.stringify(['one', 'two']));
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
});
afterEach(cleanup);
const setup = (canEdit = true, source = task) => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<PlannerCalendarView dates={[task.date]} assignments={[source]} employees={employees} vacations={[]} canEdit={canEdit} onViewDetails={vi.fn()} onCalendarChange={save} />);
  return save;
};
const start = (source = task, mode = 'move') => act(() => { captured.props.onDragStart({ active: { data: { current: { task: source, employeeId: 'one', mode } } } }); });
const end = (over: { id: string } | null, y = 80) => act(async () => { await captured.props.onDragEnd({ delta: { x: 0, y }, over }); });
describe('Calendar gesture integration', () => {
  it('commits time movement and another employee exactly once', async () => {
    const save = setup(); start(); await end({ id: 'two' });
    expect(save).toHaveBeenCalledExactlyOnceWith(task, { fromTime: '10:00', toTime: '12:00', employeeId: 'two' });
  });
  it('commits end resize without employee reassignment', async () => {
    const save = setup(); start(task, 'end'); await end({ id: 'two' });
    expect(save).toHaveBeenCalledExactlyOnceWith(task, { fromTime: '08:00', toTime: '12:00', employeeId: 'one' });
  });
  it('does not save without edit permission', async () => {
    const save = setup(false); start(); await end({ id: 'two' }); expect(save).not.toHaveBeenCalled();
  });
  it('warns and blocks tasks with multiple employees', async () => {
    const multi = { ...task, employees: ['one', 'two'] }; const save = setup(true, multi); start(multi); await end({ id: 'two' });
    expect(captured.warning).toHaveBeenCalledWith('planner.calendarDrag.multipleEmployees'); expect(save).not.toHaveBeenCalled();
  });
  it('does not save a drop outside a lane', async () => {
    const save = setup(); start(); await end(null); expect(save).not.toHaveBeenCalled();
  });
  it('does not save an unchanged gesture', async () => {
    const save = setup(); start(); await end({ id: 'one' }, 0); expect(save).not.toHaveBeenCalled();
  });
  it('cancels without saving', async () => {
    const save = setup(); start(); act(() => { captured.props.onDragCancel({}); }); await end({ id: 'two' }); expect(save).not.toHaveBeenCalled();
  });
  it('still opens existing task details', () => { setup(); expect(screen.getByText('Task')).toBeInTheDocument(); });
});