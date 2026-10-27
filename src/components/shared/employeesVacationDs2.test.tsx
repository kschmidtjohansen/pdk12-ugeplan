import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import MobileEmployeeCard from '@/components/Employees/MobileEmployeeCard';
import EmployeesTable from '@/components/Employees/EmployeesTable';
import VacationHeader from '@/components/Vacation/VacationHeader';
import VacationTabContent from '@/components/Vacation/VacationTabContent';
import type { Employee } from '@/types/employee';
import type { Vacation } from '@/types/vacation';

const state = vi.hoisted(() => ({ admin: true, mobile: true, viewAll: true }));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ currentLanguage: 'da', t: (k: string) => ({ 'common.edit': 'Redigér', 'common.delete': 'Slet', 'common.actions': 'Handlinger', 'vacation.tabs.all': 'Alle', 'vacation.tabs.pending': 'Afventende', 'vacation.tabs.approved': 'Godkendte', 'vacation.approve': 'Godkend', 'vacation.reject': 'Afvis' } as Record<string, string>)[k] ?? k }) }));
vi.mock('@/context/AuthContext', () => ({ usePermissions: () => ({ isAdmin: state.admin }), useAuth: () => ({ user: { id: 'self' }, isEffectiveAdmin: state.admin, isEffectiveSkadeleder: false, isEffectiveServicemedarbejder: !state.admin, canViewAllVacations: state.viewAll, canManageVacations: state.admin, effectiveRole: state.admin ? 'administrator' : 'servicemedarbejder' }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => state.mobile }));
vi.mock('@tanstack/react-virtual', () => ({ useVirtualizer: () => ({ getVirtualItems: () => [], getTotalSize: () => 0 }) }));
vi.mock('@/components/Shared/EmployeeContactActions', () => ({ default: () => null }));
vi.mock('@/components/Vacation/VacationGridOverview', () => ({ default: () => <div>kalender</div> }));

const emp: Employee = { id: 'e1', name: 'Bo Hansen', email: 'bo@example.invalid', phone: '+4511111111', role: 'servicemedarbejder', jobTitle: 'Tekniker', status: 'active' };
const vac = (id: string, user_id: string, status: Vacation['status']): Vacation => ({ id, user_id, start_date: '2026-10-25', end_date: '2026-10-26', status, reason: 'Ferie', user: { id: user_id, name: `N${id}`, email: '' } });
const noop = vi.fn();
afterEach(cleanup);
beforeEach(() => { state.admin = true; state.mobile = true; state.viewAll = true; });

it('mobile employee card: status as text, actions wrap and only render for admins', () => {
  render(<MobileEmployeeCard employee={emp} vacations={[]} onEdit={noop} onDelete={noop} onToggleSick={noop} />);
  const card = screen.getByTestId('mobile-employee-card');
  const group = within(card).getByRole('group', { name: 'Handlinger' });
  expect(group.className).toMatch(/flex-wrap/);
  expect(within(group).getByRole('button', { name: 'Redigér' }).className).toMatch(/min-h-11/);
  cleanup(); state.admin = false;
  render(<MobileEmployeeCard employee={emp} vacations={[]} onEdit={noop} onDelete={noop} />);
  expect(screen.queryByRole('group', { name: 'Handlinger' })).toBeNull();
});

it('employees table distinguishes empty department, filtered empty, loading and error', () => {
  const base = { vacations: [], onEdit: noop, onDelete: noop, onToggleLeave: noop, onRetry: noop };
  const v = render(<EmployeesTable {...base} employees={[]} error={null} loading={false} />);
  expect(screen.getByTestId('employees-empty')).toBeInTheDocument(); v.unmount();
  const reset = vi.fn();
  const f = render(<EmployeesTable {...base} employees={[]} isFiltered onResetFilters={reset} error={null} loading={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ryd filtre' })); expect(reset).toHaveBeenCalled(); f.unmount();
  const l = render(<EmployeesTable {...base} employees={[]} error={null} loading />);
  expect(screen.getByRole('status', { name: 'Indlæser medarbejdere' })).toBeInTheDocument(); l.unmount();
});

it('desktop 1280 renders a table; mobile 360/390 renders a list without table', () => {
  state.mobile = false;
  const base = { vacations: [], onEdit: noop, onDelete: noop, onToggleLeave: noop, onRetry: noop, error: null, loading: false };
  const d = render(<EmployeesTable {...base} employees={[emp]} />);
  expect(screen.getByRole('table')).toBeInTheDocument(); d.unmount();
  state.mobile = true;
  render(<EmployeesTable {...base} employees={[emp]} />);
  expect(screen.queryByRole('table')).toBeNull();
  expect(screen.getByRole('list')).toBeInTheDocument();
});

it('vacation header: status tabs with counts and Liste/Kalender switch keeps calendar value', () => {
  const change = vi.fn();
  render(<VacationHeader counts={{ all: 3, pending: 1, approved: 1, rejected: 1 }} isServicemedarbejder={false} activeTab="all" onChangeTab={change} />);
  expect(screen.getByTestId('vacation-count-pending')).toHaveTextContent('1');
  expect(screen.getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Kalender' }));
  expect(change).toHaveBeenCalledWith('calendar');
});

it('servicemedarbejder without view-all sees only own requests and no calendar switch', () => {
  state.admin = false; state.viewAll = false;
  render(<VacationTabContent tabValue="all" vacations={[vac('1', 'self', 'pending'), vac('2', 'other', 'pending')]} onApprove={noop} onReject={noop} onEdit={noop} onDelete={noop} />);
  expect(screen.getByTestId('vacation-result-count')).toHaveTextContent('Viser 1 af 1');
  cleanup();
  render(<VacationHeader isServicemedarbejder activeTab="all" onChangeTab={noop} />);
  expect(screen.queryByRole('button', { name: 'Kalender' })).toBeNull();
});

it('vacation empty: department-empty differs from no filter match', () => {
  render(<VacationTabContent tabValue="all" vacations={[]} onApprove={noop} onReject={noop} onEdit={noop} onDelete={noop} />);
  expect(screen.getByText('Ingen anmodninger i afdelingen endnu')).toBeInTheDocument();
  cleanup();
  render(<VacationTabContent tabValue="all" search="zzz" onReset={noop} vacations={[vac('1', 'self', 'pending')]} onApprove={noop} onReject={noop} onEdit={noop} onDelete={noop} />);
  expect(screen.getByText('Ingen anmodninger matcher')).toBeInTheDocument();
});
