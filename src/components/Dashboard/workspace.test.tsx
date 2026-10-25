import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { format } from 'date-fns';
import { writeFileSync } from 'node:fs';
import TodayTimeline from './TodayTimeline';
import CompactKpiStack from './CompactKpiStack';
import TodayGuardsWidget from './TodayGuardsWidget';
import UpcomingVacationsWidget from './UpcomingVacationsWidget';
import { Assignment } from '@/types/assignment';

const state = vi.hoisted(() => ({ assignments: [] as Assignment[], warehouse: false }));
vi.mock('@/hooks/useAssignments', () => ({ useAssignments: () => ({ assignments: state.assignments, loading: false }) }));
vi.mock('@/hooks/car', () => ({ useCars: () => ({ cars: [{ id: 'car1', name: 'Servicebil 06' }] }) }));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ currentLanguage: 'da', t: (key: string) => ({ 'ui.noCasesToday': 'Ingen sager i dag', 'dashboard.metrics.title': 'Nøgletal', 'dashboard.metrics.availableEmployees': 'Ledige medarbejdere', 'dashboard.metrics.availableCars': 'Ledige biler', 'dashboard.metrics.absentEmployees': 'Fraværende medarbejdere', 'dashboard.metrics.warehouseItems': 'Lager', 'dashboard.upcomingVacations': 'Kommende fridage', 'ui.dutiesToday': 'Vagter i dag' }[key] || key) }) }));
vi.mock('@/hooks/duty/useDutyData', () => ({ useDutyData: () => ({ duties: [] }) }));
vi.mock('@/hooks/duty/useDutyEmployees', () => ({ useDutyEmployees: () => ({ employees: [] }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: [] }) }));
vi.mock('./../Shared/EmployeeContactActions', () => ({ default: () => null }));
vi.mock('@/context/DepartmentContext', () => ({ useDepartment: () => ({ isWarehouseEnabled: state.warehouse }) }));
vi.mock('@/hooks/useDashboardMetrics', () => ({ useDashboardMetrics: () => ({ loading: false, metrics: { availableEmployees: { count: 4, total: 12, employees: [] }, availableCars: { count: 2, total: 6, cars: [] }, absentEmployees: { count: 1, employees: [] }, warehouseItems: { count: 8 } }, assignments: [], vacations: [] }) }));
vi.mock('./EmployeeAvailabilityDialog', () => ({ default: ({ open }: { open: boolean }) => open ? <div role="dialog">Medarbejdere</div> : null }));
vi.mock('./CarAvailabilityModal', () => ({ default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div role="dialog">Biler</div> : null }));
vi.mock('./AbsentEmployeesModal', () => ({ default: () => null }));
vi.mock('./AssignmentDetailsDialog', () => ({ default: ({ assignment }: { assignment: Assignment }) => <div role="dialog">{assignment.title}</div> }));
afterEach(() => { cleanup(); state.warehouse = false; state.assignments = []; });
const example = (): Assignment => ({ id: 'a1', title: 'Vandskade · udtørring og opfølgning', date: format(new Date(), 'yyyy-MM-dd'), fromTime: '08:00', toTime: '16:00', location: 'Industrivej 12, Hillerød', published: true, cars: ['car1'], assignedEmployees: [{ id: 'e1', name: 'Anna Jensen', email: 'example@example.invalid' }] });
describe('Arbejdsfladens bevarede handlinger', () => {
  it('åbner den valgte sag fra tidslinjen', async () => {
    state.assignments = [example()];
    render(<TodayTimeline active={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Vandskade/ }));
    expect(await screen.findByRole('dialog')).toHaveTextContent(example().title);
  });
  it('åbner medarbejdere og biler fra de konkrete KPI-værdier', () => {
    render(<MemoryRouter><CompactKpiStack /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Ledige medarbejdere: 4 / 12' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Medarbejdere');
    fireEvent.click(screen.getByRole('button', { name: 'Ledige biler: 2 / 6' }));
    expect(screen.getAllByRole('dialog')[1]).toHaveTextContent('Biler');
    expect(screen.queryByRole('button', { name: /Lager/ })).not.toBeInTheDocument();
  });
  it('kan vise tom tidslinje og rendere kontrolleret layout til visuel QA', () => {
    const empty = render(<TodayTimeline active={false} />);
    expect(screen.getByText('Ingen sager i dag')).toBeInTheDocument();
    empty.unmount();
    state.assignments = [example(), { ...example(), id: 'a2', title: 'Fugtmåling og dokumentation', fromTime: '16:00', toTime: '17:00' }];
    const view = render(<MemoryRouter><div className="operations-shell min-h-screen bg-background p-4"><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"><TodayTimeline active={false} /><aside className="space-y-4"><CompactKpiStack /><UpcomingVacationsWidget vacations={[]} /><TodayGuardsWidget /></aside></div></div></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'ui.showWholeWeek' }));
    expect(screen.getByRole('button', { name: 'ui.hideWeek' })).toHaveAttribute('aria-expanded', 'true');
    if (process.env.POLYPLAN_CAPTURE_FIXTURE === '1') writeFileSync('/tmp/browser/workspace-fixture.html', view.container.innerHTML);
  });
});