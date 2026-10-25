import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DashboardCockpit from './DashboardCockpit';
import { readPlannerLocation } from '@/utils/plannerOperations';
import type { Assignment } from '@/types/assignment';

const state = vi.hoisted(() => ({ permitted: true, assignments: [] as Assignment[] }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'me' } }), usePermissions: () => ({ canSeeUnpublishedTasks: state.permitted }) }));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/hooks/useAssignments', () => ({ useAssignments: () => ({ assignments: state.assignments, loading: false }) }));
vi.mock('@/hooks/useEmployees', () => ({ useEmployees: () => ({ employees: [] }) }));
vi.mock('@/hooks/car', () => ({ useCars: () => ({ cars: [] }) }));
vi.mock('@/hooks/useVacations', () => ({ useVacations: () => ({ vacations: [] }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('./TodayGuardsWidget', () => ({ default: () => null }));
vi.mock('./CompactKpiStack', () => ({ default: () => null }));
vi.mock('./UpcomingVacationsWidget', () => ({ default: () => null }));
vi.mock('./TodayTimeline', () => ({ default: () => null }));
vi.mock('./WeeklyAssignments', () => ({ default: () => null }));
afterEach(() => { cleanup(); state.permitted = true; state.assignments = []; });
function LocationResult() { const location = useLocation(); return <output data-testid="location">{JSON.stringify(readPlannerLocation(new URLSearchParams(location.search)))}</output>; }
const show = (role: string) => render(<MemoryRouter><DashboardCockpit showMetrics={false} showMyTasks={false} userRole={role} selectedWeek={53} selectedYear={2026} onPreviousWeek={vi.fn()} onNextWeek={vi.fn()} /><LocationResult /></MemoryRouter>);
describe('Dashboard til ugeplan', () => {
  it('åbner den valgte ISO-uge med samme kladdefilter', () => {
    state.assignments = [{ id: 'fixture', title: 'Test', date: '2027-01-01', fromTime: '08:00', toTime: '16:00', location: 'Test', published: false }];
    show('administrator');
    fireEvent.click(screen.getByRole('button', { name: 'planner.operationsOverview.drafts: 1' }));
    expect(screen.getByTestId('location')).toHaveTextContent('{"week":53,"year":2026,"issue":"drafts"}');
  });
  it('read-only uden eksisterende kladdeadgang får ikke administrationssignaler', () => {
    state.permitted = false; show('fugttekniker');
    expect(screen.queryByRole('button', { name: /operationsOverview.drafts/ })).not.toBeInTheDocument();
  });
  it('servicemedarbejder-dashboard forbliver personligt selv med ekstra planlægningsgrant', () => {
    state.permitted = true; show('servicemedarbejder');
    expect(screen.queryByRole('button', { name: /operationsOverview.drafts/ })).not.toBeInTheDocument();
  });
});