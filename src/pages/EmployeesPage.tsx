
import React, { useState } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';
import EmployeesTable from '@/components/Employees/EmployeesTable';
import EmployeeFormDialog from '@/components/Employees/EmployeeFormDialog';
import EmployeeDeleteDialog from '@/components/Employees/EmployeeDeleteDialog';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useEmployees } from '@/hooks/useEmployees';
import { useVacations } from '@/hooks/useVacations';
import { Employee } from '@/types/employee';

const EmployeesPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const { isSubstituteEnabled } = useDepartment();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const { 
    employees, regularEmployees, vikarer, loading, error, fetchEmployees,
    currentEmployee, formData, creationType,
    prepareForCreate, prepareForEdit, prepareForCreateVikar,
    handleInputChange, handleSelectChange, handleCheckboxChange,
    createEmployee, updateEmployee, deleteEmployee, toggleEmployeeLeave
  } = useEmployees();
  
  const { vacations } = useVacations();

  const handleCreateNew = () => { prepareForCreate(); setFormDialogOpen(true); };
  const handleCreateVikar = () => { prepareForCreateVikar(); setFormDialogOpen(true); };
  const handleEdit = (employee: Employee) => { prepareForEdit(employee); setFormDialogOpen(true); };
  const handleDelete = (employee: Employee) => { prepareForEdit(employee); setDeleteDialogOpen(true); };
  const confirmDelete = async () => { if (currentEmployee) { await deleteEmployee(currentEmployee.id); setDeleteDialogOpen(false); } };
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = currentEmployee ? await updateEmployee() : await createEmployee();
    if (success) setFormDialogOpen(false);
  };
  const handleToggleLeave = async (employee: Employee) => { if (!isAdmin) return; await toggleEmployeeLeave(employee, !employee.onLeave); };

  return (
    <DataFetchErrorBoundary>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {regularEmployees.length} {t("employees.title")} — {vikarer.length} Vikarer
            </h1>
            <p className="text-sm text-muted-foreground">{t("employees.description")}</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={handleCreateNew} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t("employees.addEmployee")}</span>
                <span className="sm:hidden">Tilføj</span>
              </Button>
              {isSubstituteEnabled && (
                <Button onClick={handleCreateVikar} variant="outline" size="sm">
                  <UserPlus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{t("employees.addVikar")}</span>
                  <span className="sm:hidden">Vikar</span>
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="glass-card rounded-lg border">
          <EmployeesTable 
            employees={employees} vacations={vacations}
            onEdit={handleEdit} onDelete={handleDelete} onToggleLeave={handleToggleLeave}
            error={error} loading={loading} onRetry={() => fetchEmployees()}
          />
        </div>

        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <EmployeeFormDialog 
            currentEmployee={currentEmployee} formData={formData} creationType={creationType}
            handleInputChange={handleInputChange} handleSelectChange={handleSelectChange}
            handleCheckboxChange={handleCheckboxChange} handleSubmit={handleFormSubmit}
            onClose={() => setFormDialogOpen(false)}
          />
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <EmployeeDeleteDialog employee={currentEmployee} onConfirmDelete={confirmDelete} />
        </AlertDialog>
      </div>
    </DataFetchErrorBoundary>
  );
};

export default EmployeesPage;
