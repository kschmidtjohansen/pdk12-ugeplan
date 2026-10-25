import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import WeekOperationsStrip from './WeekOperationsStrip';
import PlannerHeader from './page/PlannerHeader';
import PlannerContent from './PlannerContent';
import AssignmentActionButtons from './AssignmentActionButtons';
import { summarizeWeek } from '@/utils/plannerOperations';
import { getWeekDates } from '@/utils/dates';
import type { Assignment } from '@/types/assignment';
import da from '@/translations/da/planner';

const permissions = vi.hoisted(() => ({ canEdit: false, canCreate: false, canPublishTasks: false }));
vi.mock('@/context/AuthContext', () => ({ usePermissions: () => permissions }));
vi.mock('@/context/DepartmentContext', () => ({ useDepartment: () => ({}) }));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ currentLanguage: 'da', t: (key: string, values?: Record<string, string | number>) => {
  const value = key.split('.').slice(1).reduce<unknown>((obj, part) => obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[part] : undefined, da);
  return Object.entries(values || {}).reduce((text, [k, v]) => text.replace(`{${k}}`, String(v)), typeof value === 'string' ? value : key);
} }) }));
vi.mock('@/hooks/useVacations', () => ({ useVacations: () => ({ vacations: [] }) }));
vi.mock('@/hooks/useCrossSubDeptBusy', () => ({ useCrossSubDeptBusy: () => ({ crossBusyByDate: {} }) }));
vi.mock('./UnassignedResourcesSection', () => ({ default: ({ assignments }: { assignments: Assignment[] }) => <div data-testid="resources">{assignments.length}</div> }));
function View({ groupedAssignments, assignments }: { groupedAssignments?: Record<string, Assignment[]>; assignments?: Assignment[] }) { return <div data-testid="view">{(assignments || Object.values(groupedAssignments || {}).flat()).map(a => <span key={a.id}>{a.title}</span>)}</div>; }
vi.mock('./CurrentAndFutureDays', () => ({ default: View }));
vi.mock('./PastAssignments', () => ({ default: View }));
vi.mock('./CompactCurrentAndFutureDays', () => ({ default: View }));
vi.mock('./CompactPastAssignments', () => ({ default: View }));
vi.mock('./Calendar/PlannerCalendarView', () => ({ default: View }));
afterEach(() => { cleanup(); Object.assign(permissions, { canEdit: false, canCreate: false, canPublishTasks: false }); });
const task: Assignment = { id: 'fixture', title: 'Vandskade · Havnegade', date: '2026-12-28', fromTime: '08:00', toTime: '16:00', published: false, location: 'Havnegade 12' };
const props = { weekAssignments: [task], resourceAssignments: [task, { ...task, id: 'hidden' }], operationStates: {}, expandedDays: {}, onToggleExpansion: vi.fn(), onEditAssignment: vi.fn(), onDeleteAssignment: vi.fn(), onPublishAssignment: vi.fn(), onPublishDay: vi.fn(), onCreateAssignment: vi.fn(), onCopyAssignment: vi.fn(), selectedWeek: 53, selectedYear: 2026, weekDates: getWeekDates(53, 2026), employees: [], cars: [], filtersActive: true, onClearFilters: vi.fn(), onDayFilter: vi.fn() };
describe('Handlingsbart ugeoverblik', () => {
  it('vælger kladder og rydder statusfilter uden mutation', () => {
    const select = vi.fn();
    render(<WeekOperationsStrip summary={summarizeWeek([task], [], [])} active="drafts" week={53} onSelect={select} />);
    fireEvent.click(screen.getByRole('button', { name: 'Kladder / upublicerede: 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ryd statusfilter' }));
    expect(select.mock.calls).toEqual([['drafts'], ['all']]);
  });
  it.each(['standard', 'compact', 'grid', 'calendar'] as const)('sender samme filtrerede opgaver til %s og bevarer fuld ressourceuge', mode => {
    permissions.canEdit = true;
    render(<PlannerContent {...props} viewMode={mode} />);
    expect(screen.getAllByTestId('view').every(view => view.textContent === task.title)).toBe(true);
    expect(screen.getByTestId('resources')).toHaveTextContent('2');
  });
  it('ingen match har ryd-handling og er ikke en tom uge', () => {
    render(<PlannerContent {...props} weekAssignments={[]} />);
    expect(screen.getByText('Ingen opgaver matcher filtrene')).toBeInTheDocument();
    expect(screen.queryByText('Ingen opgaver i denne uge')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ryd alle' }));
    expect(props.onClearFilters).toHaveBeenCalledOnce();
  });
  it('dagvælger sender konkret lokal dato', () => {
    render(<PlannerContent {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vælg dato 2026-12-28' }));
    expect(props.onDayFilter).toHaveBeenCalledWith('2026-12-28');
  });
  it('read-only har ingen mutation actions', () => {
    const actions = { onEdit: vi.fn(), onDelete: vi.fn(), onPublish: vi.fn(), onCopy: vi.fn() };
    render(<AssignmentActionButtons assignment={task} {...actions} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(Object.values(actions).every(fn => fn.mock.calls.length === 0)).toBe(true);
  });
  it('publish-only viser kun publicering, ikke redigér/kopiér/slet', () => {
    permissions.canPublishTasks = true;
    const publish = vi.fn();
    render(<AssignmentActionButtons assignment={task} onEdit={vi.fn()} onCopy={vi.fn()} onDelete={vi.fn()} onPublish={publish} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Publicer' }));
    expect(publish).toHaveBeenCalledWith('fixture');
  });
  it('operation state blokerer kun mens en handling er aktiv', () => {
    permissions.canEdit = true;
    const edit = vi.fn();
    const base = { assignment: task, onEdit: edit, onCopy: vi.fn(), onDelete: vi.fn(), onPublish: vi.fn() };
    const view = render(<AssignmentActionButtons {...base} operationState="updating" />);
    fireEvent.click(screen.getByRole('button', { name: 'Opdaterer' })); expect(edit).not.toHaveBeenCalled();
    view.rerender(<AssignmentActionButtons {...base} operationState={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rediger Opgave' })); expect(edit).toHaveBeenCalledWith(task);
  });
  it('header bevarer navigation og read-only uden opret; fixture er ikke live data', () => {
    const current = vi.fn();
    const headerProps = { selectedWeek: 53, selectedYear: 2026, weekDates: getWeekDates(53, 2026), viewMode: 'standard' as const, setViewMode: vi.fn(), handlePreviousWeek: vi.fn(), handleNextWeek: vi.fn(), handlePrefetchAssignments: vi.fn(), handleCancelPrefetch: vi.fn(), handleShowOnScreen: vi.fn(), handleOpenCreateDialog: vi.fn(), onCurrentWeek: current };
    const view = render(<div className="operations-shell bg-background text-foreground p-4"><PlannerHeader {...headerProps} /><WeekOperationsStrip summary={summarizeWeek([task], [], [])} week={53} active="drafts" onSelect={vi.fn()} /><PlannerContent {...props} /></div>);
    fireEvent.click(screen.getByRole('button', { name: 'Denne uge' })); expect(current).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Ny Opgave' })).not.toBeInTheDocument();
    if (process.env.POLYPLAN_CAPTURE_FIXTURE === '1') writeFileSync('/tmp/browser/v13-fixture.html', view.container.innerHTML);
  });
});