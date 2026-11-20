
import React, { useState, useMemo } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';
import EmployeesTable from '@/components/Employees/EmployeesTable';
import EmployeeTrainingDialog from '@/components/Employees/EmployeeTrainingDialog';
import EmployeeFormDialog from '@/components/Employees/EmployeeFormDialog';
import EmployeeDeleteDialog from '@/components/Employees/EmployeeDeleteDialog';
import ListPageShell from '@/components/shared/ListPageShell';
import { FilterSegment } from '@/components/shared/SegmentedFilterBar';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useEmployees } from '@/hooks/useEmployees';
import { useVacations } from '@/hooks/useVacations';
import { useActiveTrainings } from '@/hooks/useActiveTrainings';
import { useSickToday } from '@/hooks/useSickDays';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Employee } from '@/types/employee';
import ModuleListTools from '@/components/shared/ModuleListTools';
import { formatListCount } from '@/components/shared/listCount';
import { filterEmployees, vacationEmployeeIds } from '@/utils/moduleListFilters';
import { addDays, format, parseISO, startOfISOWeek } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { SlidingSegments } from '@/components/ui/sliding-segments';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import EmployeeCardGrid, { type EmployeeCardInfo } from '@/components/Employees/EmployeeCardGrid';
import EmployeeDetailPanel, { type WeekDay } from '@/components/Employees/EmployeeDetailPanel';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';
import ErrorState from '@/components/shared/ErrorState';
import { useAssignmentDataOptimized } from '@/hooks/assignment/useAssignmentDataOptimized';
import { useCarData } from '@/hooks/car/useCarData';
import { assignmentsFor, currentOrNext, isOnAssignment, todayStatus } from '@/lib/employeeToday';
import { getEmployeeVacationStatus } from '@/utils/employeeAvailability';
import type { Assignment } from '@/types/assignment';

const VIEW_KEY = 'pp-employees-view';
const useWide = () => {
  const q = '(min-width: 1280px)';
  const [wide, setWide] = React.useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches);
  React.useEffect(() => {
    const m = window.matchMedia?.(q); if (!m) return;
    const on = () => setWide(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on);
  }, []);
  return wide;
};

type EmployeeSegment = 'all' | 'active' | 'onjob' | 'onleave' | 'vikarer';

const EmployeesPage: React.FC = () => {
  const { isAdmin, canCreate } = usePermissions();
  const { t, currentLanguage } = useTranslation();
  const { isSubstituteEnabled, selectedDepartmentId, selectedDepartment } = useDepartment();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [trainingEmployee, setTrainingEmployee] = useState<Employee | null>(null);
  const [segment, setSegment] = useState<EmployeeSegment>('all');
  const [search, setSearch] = useState('');

  const {
    employees,
    regularEmployees,
    vikarer,
    loading,
    error,
    fetchEmployees,
    currentEmployee,
    formData,
    creationType,
    prepareForCreate,
    prepareForEdit,
    prepareForCreateVikar,
    handleInputChange,
    handleSelectChange,
    handleRoleToggle,
    handleCheckboxChange,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeLeave,
  } = useEmployees();

  const { vacations } = useVacations();
  const { trainingIds } = useActiveTrainings();
  const { sickIds, canSeeSickReason, invalidate: refreshSick } = useSickToday();

  // Compute today's vacation employee IDs for "På fridage" segment.
  // Vacation rows key the employee as `user_id` (see src/types/vacation.ts).
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const onLeaveTodayIds = useMemo(() => vacationEmployeeIds(vacations, todayStr), [vacations, todayStr]);
  const { assignments } = useAssignmentDataOptimized();
  const { cars } = useCarData();
  const da = currentLanguage === 'da';
  const [view, setView] = useState<'cards' | 'table'>(() => { try { return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'cards'; } catch { return 'cards'; } });
  const changeView = (v: 'cards' | 'table') => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ } };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const wide = useWide();
  const carById = useMemo(() => new Map(cars.map(c => [c.id, c.car_number])), [cars]);
  const carLabel = React.useCallback((a: Assignment) => {
    const id = a.cars?.[0] || (typeof a.car === 'string' ? a.car : a.car?.id);
    const n = id ? carById.get(id) : undefined;
    return n ? `BIL ${String(n).replace(/^bil\s*/i, '')}` : undefined;
  }, [carById]);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const cardInfo = useMemo(() => {
    const map = new Map<string, EmployeeCardInfo>();
    const today = new Date();
    employees.forEach(e => {
      const list = assignmentsFor(assignments, e.id, todayStr);
      const vac = getEmployeeVacationStatus(e.id, today, vacations);
      const status = todayStatus({
        today: list, nowMinutes, da,
        sick: sickIds.has(e.id), canSeeSickReason, training: trainingIds.has(e.id), onLeave: e.onLeave,
        vacationUntil: vac.isOnVacation && vac.vacationType === 'full_day' ? vac.vacation?.end_date ?? null : null,
        formatDate: d => format(parseISO(d), 'd. MMM', { locale: da ? daLocale : undefined }),
      });
      const cur = currentOrNext(list, nowMinutes);
      map.set(e.id, { status, carLabel: cur ? carLabel(cur) : undefined });
    });
    return map;
  }, [employees, assignments, vacations, todayStr, nowMinutes, da, sickIds, canSeeSickReason, trainingIds, carLabel]);
  const onJobIds = useMemo(() => new Set([...cardInfo].filter(([, i]) => i.status.kind === 'onjob' || i.status.kind === 'double').map(([id]) => id)), [cardInfo]);
  const absentIds = useMemo(() => new Set(employees.filter(e => e.onLeave || onLeaveTodayIds.has(e.id) || trainingIds.has(e.id) || sickIds.has(e.id)).map(e => e.id)), [employees, onLeaveTodayIds, trainingIds, sickIds]);
  const filteredEmployees = useMemo(() => segment === 'onjob'
    ? filterEmployees(employees, regularEmployees, vikarer, 'all', search, absentIds).filter(e => onJobIds.has(e.id))
    : filterEmployees(employees, regularEmployees, vikarer, segment, search, absentIds), [employees, regularEmployees, vikarer, segment, search, absentIds, onJobIds]);
  const resetFilters = () => { setSegment('all'); setSearch(''); };

  const segments: FilterSegment[] = useMemo(() => {
    const onLeaveCount = employees.filter((e) => e.onLeave || onLeaveTodayIds.has(e.id) || trainingIds.has(e.id) || sickIds.has(e.id)).length;
    const activeCount = regularEmployees.filter((e) => !e.onLeave && !onLeaveTodayIds.has(e.id) && !trainingIds.has(e.id) && !sickIds.has(e.id)).length;
    const base: FilterSegment[] = [
      { key: 'all', label: t('common.all') || 'Alle', count: employees.length },
      { key: 'active', label: t('employees.activeSegment') || 'Tilgængelige', count: activeCount },
      { key: 'onjob', label: da ? 'På opgave' : 'On a job', count: onJobIds.size },
      { key: 'onleave', label: t('employees.onLeaveSegment') || 'Fraværende', count: onLeaveCount, highlight: onLeaveCount > 0 },
    ];
    if (isSubstituteEnabled) {
      base.push({ key: 'vikarer', label: t('ui.substitutes'), count: vikarer.length });
    }
    return base;
  }, [employees, regularEmployees, vikarer, isSubstituteEnabled, t, onLeaveTodayIds, trainingIds, sickIds, onJobIds, da]);

  const handleCreateNew = () => { prepareForCreate(); setFormDialogOpen(true); };
  const handleCreateVikar = () => { prepareForCreateVikar(); setFormDialogOpen(true); };
  const handleEdit = (employee: Employee) => { prepareForEdit(employee); setFormDialogOpen(true); };
  const handleDelete = (employee: Employee) => { prepareForEdit(employee); setDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    if (currentEmployee) {
      await deleteEmployee(currentEmployee.id);
      setDeleteDialogOpen(false);
    }
  };
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = currentEmployee ? await updateEmployee() : await createEmployee();
    if (success) setFormDialogOpen(false);
  };
  const handleToggleLeave = async (employee: Employee) => {
    if (!isAdmin) return;
    await toggleEmployeeLeave(employee, !employee.onLeave);
  };
  const handleToggleSick = async (employee: Employee) => {
    if (!isAdmin || !selectedDepartmentId) return;
    const isSick = sickIds.has(employee.id);
    try {
      if (isSick) {
        const { error } = await supabase
          .from('sick_days')
          .delete()
          .eq('user_id', employee.id)
          .eq('sick_date', todayStr);
        if (error) throw error;
        toast.success(t('ui.employeeNoLongerSick', { name: employee.name }));
      } else {
        const { error } = await supabase.from('sick_days').insert({
          user_id: employee.id,
          department_id: selectedDepartmentId,
          sick_date: todayStr,
        });
        if (error) throw error;
        toast.success(`${employee.name} er markeret som syg i dag`);
        try {
          await supabase.functions.invoke('vacation-cleanup-assignments', {
            body: {
              userId: employee.id,
              startDate: todayStr,
              endDate: todayStr,
              reason: 'sick',
            },
          });
        } catch (cleanupError) {
          if (import.meta.env.DEV) console.warn('Sygemelding: oprydning af opgaver fejlede', (cleanupError as { message?: string })?.message);
        }
      }
      refreshSick();
    } catch (err) {
      toast.error((err as { message?: string })?.message || 'Kunne ikke opdatere sygemelding');
    }
  };

  const handleTraining = (employee: Employee) => {
    if (!isAdmin) return;
    setTrainingEmployee(employee);
    setTrainingDialogOpen(true);
  };

  const panelEmployee = (selectedId && filteredEmployees.find(e => e.id === selectedId)) || (wide ? filteredEmployees[0] : undefined);
  const weekStart = startOfISOWeek(new Date());
  const renderPanel = (e: Employee, onClose?: () => void) => {
    const info = cardInfo.get(e.id);
    const mine = assignments.filter(a => isOnAssignment(a, e.id));
    const week: WeekDay[] = [0, 1, 2, 3, 4].map(n => {
      const d = addDays(weekStart, n), date = format(d, 'yyyy-MM-dd');
      const vac = getEmployeeVacationStatus(e.id, d, vacations);
      return { date, label: format(d, 'EEE', { locale: da ? daLocale : undefined }).replace('.', '').replace(/^./, c => c.toUpperCase()), count: mine.filter(a => a.date === date).length, off: vac.isOnVacation && vac.vacationType === 'full_day', isToday: date === todayStr };
    });
    const limit = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    const upcoming = mine.filter(a => a.date >= todayStr && a.date <= limit).sort((x, y) => (x.date + x.fromTime).localeCompare(y.date + y.fromTime)).slice(0, 8);
    return (
      <EmployeeDetailPanel
        employee={e} status={info?.status ?? { kind: 'free', tone: 'muted', label: da ? 'Ledig' : 'Free' }} departmentName={selectedDepartment?.name}
        roleLabel={t(`employees.${e.role}`)} today={assignmentsFor(assignments, e.id, todayStr)} week={week} upcoming={upcoming}
        vacations={vacations.filter(v => v.user_id === e.id && v.status !== 'rejected')} carLabel={carLabel} da={da}
        isAdmin={isAdmin} canCreate={canCreate} canSeeContact isSick={sickIds.has(e.id)} isOnTraining={trainingIds.has(e.id)}
        onEdit={() => handleEdit(e)} onDelete={() => handleDelete(e)}
        onToggleSick={isAdmin ? () => handleToggleSick(e) : undefined} onTraining={isAdmin ? () => handleTraining(e) : undefined}
        onToggleLeave={isAdmin ? () => handleToggleLeave(e) : undefined} onClose={onClose}
      />
    );
  };

  return (
    <DataFetchErrorBoundary>
      <ListPageShell workspace densityToggle={view === 'table'} className={view === 'cards' ? 'overflow-visible border-0 bg-transparent shadow-none' : 'border-t-0 bg-transparent pt-3'}
        title={t('navigation.employees')}
        description={loading ? t('employees.description') : (da ? `${employees.length} personer · ${absentIds.size} fraværende i dag` : `${employees.length} people · ${absentIds.size} absent today`)}
        eyebrow={selectedDepartment?.name}
        meta={loading ? undefined : (
          <span data-testid="employees-result-count">{formatListCount(filteredEmployees.length, employees.length, segment !== 'all' || !!search.trim(), currentLanguage === 'da')}</span>
        )}
        actions={
          isAdmin && (
            <>
              <Button onClick={handleCreateNew} size="sm" className="min-h-11">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('employees.addEmployee')}</span>
                <span className="sm:hidden">{currentLanguage === 'da' ? 'Tilføj' : 'Add'}</span>
              </Button>
              {isSubstituteEnabled && (
                <Button onClick={handleCreateVikar} variant="outline" size="sm" className="min-h-11">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('employees.addVikar')}</span>
                  <span className="sm:hidden">Vikar</span>
                </Button>
              )}
            </>
          )
        }
        filterBar={
          <ModuleListTools segments={segments} active={segment} onSelect={k => setSegment(k as EmployeeSegment)}
              search={search} onSearch={setSearch} placeholder={t('employees.searchPlaceholder')}
              count={filteredEmployees.length} total={employees.length} onReset={resetFilters}
              trailing={<SlidingSegments ariaLabel={da ? 'Visning' : 'View'} value={view} onChange={changeView}
                segments={[{ key: 'cards', label: da ? 'Kort' : 'Cards' }, { key: 'table', label: da ? 'Tabel' : 'Table' }]} />} />
        }
      >
        {view === 'table' ? (
        <div className="facet-card overflow-hidden">
          <EmployeesTable
            employees={filteredEmployees}
            isFiltered={segment !== 'all' || !!search.trim()}
            onResetFilters={resetFilters}
            vacations={vacations}
            trainingIds={trainingIds}
            sickIds={sickIds}
            canSeeSickReason={canSeeSickReason}
            onToggleSick={isAdmin ? handleToggleSick : undefined}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleLeave={handleToggleLeave}
            onTraining={isAdmin ? handleTraining : undefined}
            error={error}
            loading={loading}
            onRetry={fetchEmployees}
          />
          </div>
        ) : loading ? <ListSkeleton variant="card" rowCount={6} /> : error ? <ErrorState description={error} onRetry={fetchEmployees} /> : filteredEmployees.length === 0 ? (
          <EmptyState variant={employees.length ? 'filtered' : 'empty'} title={employees.length ? (da ? 'Ingen medarbejdere matcher' : 'No matching employees') : (da ? 'Ingen medarbejdere i afdelingen' : 'No employees in this department')}
            action={employees.length ? { label: da ? 'Ryd filtre' : 'Clear filters', onClick: resetFilters } : undefined} />
        ) : (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
            <EmployeeCardGrid employees={filteredEmployees} info={cardInfo} selectedId={wide ? panelEmployee?.id ?? null : selectedId} onSelect={e => setSelectedId(e.id)} />
            {wide && panelEmployee && <div className="sticky top-20">{renderPanel(panelEmployee)}</div>}
          </div>
        )}
      </ListPageShell>

      <Sheet open={!wide && view === 'cards' && !!selectedId && !!panelEmployee} onOpenChange={o => { if (!o) setSelectedId(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md [&>button]:hidden">
          <SheetTitle className="sr-only">{panelEmployee?.name}</SheetTitle>
          {!wide && panelEmployee && renderPanel(panelEmployee, () => setSelectedId(null))}
        </SheetContent>
      </Sheet>

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <EmployeeFormDialog
          currentEmployee={currentEmployee}
          formData={formData}
          creationType={creationType}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          handleRoleToggle={handleRoleToggle}
          handleCheckboxChange={handleCheckboxChange}
          handleSubmit={handleFormSubmit}
          onClose={() => setFormDialogOpen(false)}
        />
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <EmployeeDeleteDialog employee={currentEmployee} onConfirmDelete={confirmDelete} />
      </AlertDialog>

      <EmployeeTrainingDialog
        open={trainingDialogOpen}
        onOpenChange={setTrainingDialogOpen}
        employee={trainingEmployee}
      />
    </DataFetchErrorBoundary>
  );
};

export default EmployeesPage;
