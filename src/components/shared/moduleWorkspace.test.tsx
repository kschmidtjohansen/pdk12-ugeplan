import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import ModuleListTools from './ModuleListTools';
import MobileEmployeeCard from '@/components/Employees/MobileEmployeeCard';
import MobileCarCard from '@/components/Cars/MobileCarCard';
import EmployeesTable from '@/components/Employees/EmployeesTable';
import VacationHeader from '@/components/Vacation/VacationHeader';
import VacationTabContent from '@/components/Vacation/VacationTabContent';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Employee } from '@/types/employee';
import type { CarData } from '@/components/Cars/types';
import type { Vacation } from '@/types/vacation';
const state = vi.hoisted(() => ({ language: 'da', admin: true, mobile: true, virtualCount: 0 }));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ currentLanguage: state.language, t: (key: string) => {
  const da: Record<string, string> = { 'employees.contact': 'Kontakt', 'employees.role': 'Rolle', 'employees.name': 'Navn', 'employees.noEmployees': 'Ingen medarbejdere', 'employees.noEmployeesDescription': 'Ingen registreringer endnu', 'common.edit': 'Redigér', 'common.delete': 'Slet', 'common.available': 'Tilgængelig', 'common.yes': 'Ja', 'cars.numberPlate': 'Nummerplade', 'cars.hasTrailerHitch': 'Anhængertræk', 'cars.notBookedToday': 'Ikke booket i dag', 'cars.markUnavailable': 'Markér utilgængelig', 'ui.scheduleWorkshopVisit': 'Planlæg utilgængelighed', 'vacation.tabs.all': 'Alle', 'vacation.tabs.pending': 'Afventende', 'vacation.tabs.approved': 'Godkendte', 'vacation.tabs.calendar': 'Kalender', 'vacation.applyForVacation': 'Ansøg om fri', 'vacation.requestForEmployee': 'Ansøg for medarbejder', 'vacation.status.pending': 'Afventende', 'vacation.reason': 'Årsag', 'vacation.fullDay': 'Hel dag', 'vacation.approve': 'Godkend', 'vacation.reject': 'Afvis' };
  const en: Record<string, string> = { 'employees.contact': 'Contact', 'employees.role': 'Role', 'employees.name': 'Name', 'common.edit': 'Edit', 'common.delete': 'Delete', 'common.available': 'Available', 'common.yes': 'Yes', 'cars.numberPlate': 'Number plate', 'cars.hasTrailerHitch': 'Trailer hitch', 'cars.notBookedToday': 'Not booked today', 'cars.markUnavailable': 'Mark unavailable', 'ui.scheduleWorkshopVisit': 'Schedule unavailability', 'vacation.tabs.all': 'All', 'vacation.tabs.pending': 'Pending', 'vacation.tabs.approved': 'Approved', 'vacation.tabs.calendar': 'Calendar', 'vacation.applyForVacation': 'Request leave', 'vacation.requestForEmployee': 'Request for employee', 'vacation.status.pending': 'Pending', 'vacation.reason': 'Reason', 'vacation.fullDay': 'Full day', 'vacation.approve': 'Approve', 'vacation.reject': 'Reject' };
  return (state.language === 'da' ? da : en)[key] ?? key.split('.').pop() ?? key;
} }) }));
vi.mock('@/context/AuthContext', () => ({ usePermissions: () => ({ isAdmin: state.admin }), useAuth: () => ({ user: { id: 'self' }, isEffectiveAdmin: state.admin, isEffectiveServicemedarbejder: !state.admin, canViewAllVacations: state.admin, effectiveRole: state.admin ? 'administrator' : 'servicemedarbejder' }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => state.mobile }));
vi.mock('@tanstack/react-virtual', () => ({ useVirtualizer: ({ count }: { count: number }) => { state.virtualCount = count; return { getVirtualItems: () => [], getTotalSize: () => count * 56 }; } }));
vi.mock('@/components/Shared/EmployeeContactActions', () => ({ default: () => null }));
vi.mock('@/components/Vacation/VacationGridOverview', () => ({ default: () => null }));
const employee: Employee = { id: 'self', name: 'Anna Jensen', email: 'anna@example.invalid', phone: '+4512345678', role: 'servicemedarbejder', jobTitle: 'Servicemedarbejder', status: 'active' };
const car: CarData & { _scheduledUpcoming?: { start_date: string } } = { id: 'car', name: 'Servicebil 06', car_number: '06-12', number_plate: 'AB12345', is_available: true, fuel_card_code: null, notes: 'Service aftalt', _scheduledUpcoming: { start_date: '2026-11-01' } };
const vacation: Vacation = { id: 'v', user_id: 'self', start_date: '2026-10-25', end_date: '2026-10-26', status: 'pending', reason: 'Ferie', user: { id: 'self', name: 'Anna Jensen', email: '' } };
const noop = vi.fn();
afterEach(cleanup);
beforeEach(() => { state.language = 'da'; state.admin = true; state.mobile = true; vi.clearAllMocks(); });
it('filter controls select, search, reset and expose pressed state in both languages', () => {
  for (const language of ['da', 'en']) {
    state.language = language; const select = vi.fn(), search = vi.fn(), reset = vi.fn();
    const view = render(<ModuleListTools segments={[{ key: 'all', label: 'Alle', count: 2 }, { key: 'active', label: 'Aktive', count: 1 }]} active="active" onSelect={select} search="Anna" onSearch={search} placeholder="Search" count={1} total={2} onReset={reset} />);
    expect(screen.getByRole('button', { name: 'Aktive 1' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Alle 2' })); expect(select).toHaveBeenCalledWith('all');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Bo' } }); expect(search).toHaveBeenCalledWith('Bo');
    fireEvent.click(screen.getByRole('button', { name: language === 'da' ? 'Ryd filtre' : 'Clear filters' })); expect(reset).toHaveBeenCalledOnce(); view.unmount();
  }
});
it('retains employee edit/delete/contact and hides privileged actions for non-admin', () => {
  const edit = vi.fn(), remove = vi.fn();
  const view = render(<MobileEmployeeCard employee={employee} vacations={[]} onEdit={edit} onDelete={remove} />);
  fireEvent.click(screen.getByRole('button', { name: 'Redigér' })); expect(edit).toHaveBeenCalledWith(employee);
  fireEvent.click(screen.getByRole('button', { name: 'Slet' })); expect(remove).toHaveBeenCalledWith(employee);
  expect(screen.getByRole('link', { name: employee.phone })).toHaveAttribute('href', `tel:${employee.phone}`);
  state.admin = false; view.rerender(<MobileEmployeeCard employee={employee} vacations={[]} onEdit={edit} onDelete={remove} />);
  expect(screen.queryByRole('button', { name: 'Redigér' })).not.toBeInTheDocument();
});
it('car details are keyboard-operable and schedule/edit callbacks are preserved', () => {
  const schedule = vi.fn(); render(<TooltipProvider><MobileCarCard car={car} isAdmin canViewFuelCardCode={false} onEdit={noop} onDelete={noop} onToggleAvailability={noop} onSchedule={schedule} /></TooltipProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Vis detaljer' }));
  expect(screen.getByRole('button', { name: 'Skjul detaljer' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('Service aftalt')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Planlæg utilgængelighed' })); expect(schedule).toHaveBeenCalledWith(car);
});
it('employee empty match differs from empty data and desktop virtualises at exactly 50', () => {
  const view = render(<EmployeesTable employees={[]} vacations={[]} onEdit={noop} onDelete={noop} onToggleLeave={noop} onRetry={noop} loading={false} error={null} isFiltered onResetFilters={noop} />);
  expect(screen.getByText('Ingen medarbejdere matcher')).toBeInTheDocument();
  state.mobile = false; view.rerender(<EmployeesTable employees={Array.from({ length: 50 }, (_, i) => ({ ...employee, id: String(i) }))} vacations={[]} onEdit={noop} onDelete={noop} onToggleLeave={noop} onRetry={noop} loading={false} error={null} />);
  expect(state.virtualCount).toBe(50);
});
it('vacation filters show no match separately and never reveal other users pending requests', () => {
  state.admin = false;
  const view = render(<VacationTabContent vacations={[vacation, { ...vacation, id: 'hidden', user_id: 'other', user: { id: 'other', name: 'Secret', email: '' } }]} tabValue="pending" search="Secret" onApprove={noop} onReject={noop} onEdit={noop} onDelete={noop} />);
  expect(screen.getByText('Ingen anmodninger matcher')).toBeInTheDocument(); expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  view.rerender(<VacationTabContent vacations={[]} tabValue="all" onApprove={noop} onReject={noop} onEdit={noop} onDelete={noop} />);
  expect(screen.getByText('Ingen anmodninger i afdelingen endnu')).toBeInTheDocument();
});
it('renders controlled module fixtures in Danish and English (not authenticated pages)', () => {
  if (process.env.POLYPLAN_CAPTURE_FIXTURE !== '1') return;
  mkdirSync('/tmp/browser/v141', { recursive: true });
  for (const language of ['da', 'en']) {
    state.language = language;
    const view = render(<TooltipProvider><main className="operations-shell bg-background p-4 space-y-4"><h1 className="text-xl font-semibold">PolyPlan · {language === 'da' ? 'Medarbejdere, biler og fridage' : 'People, vehicles and leave'}</h1>
      <ModuleListTools segments={[{ key: 'all', label: language === 'da' ? 'Alle' : 'All', count: 12 }, { key: 'active', label: language === 'da' ? 'Tilgængelige' : 'Available', count: 8 }, { key: 'onleave', label: language === 'da' ? 'Fraværende' : 'Absent', count: 3 }, { key: 'vikarer', label: language === 'da' ? 'Vikarer' : 'Temporary', count: 1 }]} active="all" onSelect={noop} search="" onSearch={noop} placeholder={language === 'da' ? 'Søg medarbejdere' : 'Search people'} count={12} total={12} onReset={noop} />
      <div className="grid gap-4 md:grid-cols-2"><MobileEmployeeCard employee={employee} vacations={[]} onEdit={noop} onDelete={noop} /><MobileCarCard car={car} isAdmin canViewFuelCardCode={false} onEdit={noop} onDelete={noop} onToggleAvailability={noop} onSchedule={noop} /></div>
      <VacationHeader counts={{ all: 1, pending: 1, approved: 0, rejected: 0 }} isServicemedarbejder={false} activeTab="pending" onChangeTab={noop} onOpenRequestDialog={noop} onOpenAdminDialog={noop} />
      <VacationTabContent vacations={[vacation]} tabValue="pending" onApprove={noop} onReject={noop} onEdit={noop} onDelete={noop} />
    </main></TooltipProvider>);
    writeFileSync(`/tmp/browser/v141/modules-${language}.html`, view.container.innerHTML); view.unmount();
  }
});