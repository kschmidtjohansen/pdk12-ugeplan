
import React, { useState } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { Button } from '@/components/ui/button';
import { Plus, Users, UserPlus } from 'lucide-react';
import EmployeesTable from '@/components/Employees/EmployeesTable';
import EmployeeFormDialog from '@/components/Employees/EmployeeFormDialog';
import EmployeeDeleteDialog from '@/components/Employees/EmployeeDeleteDialog';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useEmployees } from '@/hooks/useEmployees';
import { useVacations } from '@/hooks/useVacations';
import { Employee } from '@/types/employee';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const EmployeesPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const { isSubstituteEnabled } = useDepartment();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);

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
    handleCheckboxChange,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeLeave
  } = useEmployees();
  
  const { vacations } = useVacations();

  const handleCreateNew = () => {
    prepareForCreate();
    setFormDialogOpen(true);
  };

  const handleCreateVikar = () => {
    prepareForCreateVikar();
    setFormDialogOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    prepareForEdit(employee);
    setFormDialogOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    prepareForEdit(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (currentEmployee) {
      await deleteEmployee(currentEmployee.id);
      setDeleteDialogOpen(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = currentEmployee ? await updateEmployee() : await createEmployee();
    if (success) {
      setFormDialogOpen(false);
    }
  };

  const handleToggleLeave = async (employee: Employee) => {
    if (!isAdmin) return;
    await toggleEmployeeLeave(employee, !employee.onLeave);
  };

  const handleRetry = () => {
    fetchEmployees();
  };

  return (
    <DataFetchErrorBoundary>
    <div className="min-h-screen w-full bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Simple Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {regularEmployees.length} {t("employees.title")} - {vikarer.length} Vikarer
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("employees.description")}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={handleCreateNew} size="sm" className="sm:size-default">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t("employees.addEmployee")}</span>
                <span className="sm:hidden">Tilføj</span>
              </Button>
              {isSubstituteEnabled && (
                <Button onClick={handleCreateVikar} variant="outline" size="sm" className="sm:size-default">
                  <UserPlus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t("employees.addVikar")}</span>
                  <span className="sm:hidden">Vikar</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Employees Table */}
        <div className="bg-card rounded-lg border shadow-sm">
          <EmployeesTable 
            employees={employees}
            vacations={vacations}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleLeave={handleToggleLeave}
            error={error}
            loading={loading}
            onRetry={handleRetry}
          />
        </div>

        {/* Form Dialog */}
        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <EmployeeFormDialog 
            currentEmployee={currentEmployee}
            formData={formData}
            creationType={creationType}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            handleCheckboxChange={handleCheckboxChange}
            handleSubmit={handleFormSubmit}
            onClose={() => setFormDialogOpen(false)}
          />
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <EmployeeDeleteDialog
            employee={currentEmployee}
            onConfirmDelete={confirmDelete}
          />
        </AlertDialog>
      </div>
    </div>
    </DataFetchErrorBoundary>
  );
};

export default EmployeesPage;
