
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
import SegmentedFilterBar, { FilterSegment } from '@/components/shared/SegmentedFilterBar';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useEmployees } from '@/hooks/useEmployees';
import { useVacations } from '@/hooks/useVacations';
import { Employee } from '@/types/employee';
import { format } from 'date-fns';

type EmployeeSegment = 'all' | 'active' | 'onleave' | 'vikarer';

const EmployeesPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const { isSubstituteEnabled } = useDepartment();
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

  // Compute today's vacation employee IDs for "På fridage" segment
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const onLeaveTodayIds = useMemo(() => {
    const ids = new Set<string>();
    vacations
      .filter((v: any) => v.status === 'approved' && v.start_date <= todayStr && v.end_date >= todayStr)
      .forEach((v: any) => ids.add(v.employee_id));
    return ids;
  }, [vacations, todayStr]);

  const filteredEmployees = useMemo(() => {
    let list: Employee[] = employees;
    if (segment === 'active') list = regularEmployees.filter((e) => !e.onLeave);
    else if (segment === 'onleave') list = employees.filter((e) => e.onLeave || onLeaveTodayIds.has(e.id));
    else if (segment === 'vikarer') list = vikarer;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.jobTitle?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [employees, regularEmployees, vikarer, segment, search, onLeaveTodayIds]);

  const segments: FilterSegment[] = useMemo(() => {
    const onLeaveCount = employees.filter((e) => e.onLeave || onLeaveTodayIds.has(e.id)).length;
    const base: FilterSegment[] = [
      { key: 'all', label: t('common.all') || 'Alle', count: employees.length },
      { key: 'active', label: t('employees.activeSegment') || 'Tilgængelige', count: regularEmployees.filter((e) => !e.onLeave).length },
      { key: 'onleave', label: t('employees.onLeaveSegment') || 'Fraværende', count: onLeaveCount, highlight: onLeaveCount > 0 },
    ];
    if (isSubstituteEnabled) {
      base.push({ key: 'vikarer', label: 'Vikarer', count: vikarer.length });
    }
    return base;
  }, [employees, regularEmployees, vikarer, isSubstituteEnabled, t, onLeaveTodayIds]);

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
  const handleTraining = (employee: Employee) => {
    if (!isAdmin) return;
    setTrainingEmployee(employee);
    setTrainingDialogOpen(true);
  };

  return (
    <DataFetchErrorBoundary>
      <ListPageShell
        title={t('navigation.employees')}
        description={t('employees.description')}
        actions={
          isAdmin && (
            <>
              <Button onClick={handleCreateNew} size="sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('employees.addEmployee')}</span>
                <span className="sm:hidden">Tilføj</span>
              </Button>
              {isSubstituteEnabled && (
                <Button onClick={handleCreateVikar} variant="outline" size="sm">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('employees.addVikar')}</span>
                  <span className="sm:hidden">Vikar</span>
                </Button>
              )}
            </>
          )
        }
        filterBar={
          <SegmentedFilterBar
            segments={segments}
            activeKey={segment}
            onSegmentChange={(k) => setSegment(k as EmployeeSegment)}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={t('common.searchPlaceholder') || 'Søg navn, email, titel…'}
          />
        }
      >
        <EmployeesTable
          employees={filteredEmployees}
          vacations={vacations}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleLeave={handleToggleLeave}
          onTraining={isAdmin ? handleTraining : undefined}
          error={error}
          loading={loading}
          onRetry={fetchEmployees}
        />
      </ListPageShell>

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
