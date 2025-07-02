
import React, { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import EmployeesTable from '@/components/Employees/EmployeesTable';
import EmployeeFormDialog from '@/components/Employees/EmployeeFormDialog';
import EmployeeDeleteDialog from '@/components/Employees/EmployeeDeleteDialog';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/types/employee';

const EmployeesPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const { 
    employees, 
    loading, 
    error,
    fetchEmployees,
    currentEmployee,
    formData,
    prepareForCreate,
    prepareForEdit,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeLeave
  } = useEmployees();

  const handleCreateNew = () => {
    prepareForCreate();
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

  const handleToggleLeave = (employee: Employee) => {
    if (!isAdmin) return;
    toggleEmployeeLeave(employee, !employee.onLeave);
  };

  const handleRetry = () => {
    fetchEmployees();
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Simple Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("employees.title")} ({employees.length})
            </h1>
            <p className="text-gray-600">
              {t("employees.description")}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              {t("employees.addEmployee")}
            </Button>
          )}
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg border shadow-sm">
          <EmployeesTable 
            employees={employees}
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
  );
};

export default EmployeesPage;
