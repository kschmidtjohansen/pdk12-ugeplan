
import React, { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import EmployeeList from '@/components/Employees/EmployeeList';
import EmployeeFormDialog from '@/components/Employees/EmployeeFormDialog';
import EmployeeDeleteDialog from '@/components/Employees/EmployeeDeleteDialog';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/types/employee';

const EmployeesPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markLeaveDialogOpen, setMarkLeaveDialogOpen] = useState(false);
  const [markAvailableDialogOpen, setMarkAvailableDialogOpen] = useState(false);
  const [employeeNote, setEmployeeNote] = useState('');

  // Use the correct employees hook
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
  };

  const handleEdit = (employee: Employee) => {
    prepareForEdit(employee);
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

  const handleToggleLeave = (employee: Employee) => {
    if (!isAdmin) return;
    prepareForEdit(employee);
    if (employee.onLeave) {
      setMarkAvailableDialogOpen(true);
      setEmployeeNote(employee.notes || '');
    } else {
      setMarkLeaveDialogOpen(true);
      setEmployeeNote('');
    }
  };

  const handleConfirmMarkLeave = async () => {
    if (currentEmployee) {
      await toggleEmployeeLeave(currentEmployee, true, employeeNote);
      setMarkLeaveDialogOpen(false);
    }
  };

  const handleConfirmMarkAvailableWithNote = async () => {
    if (currentEmployee) {
      await toggleEmployeeLeave(currentEmployee, false, employeeNote);
      setMarkAvailableDialogOpen(false);
    }
  };

  const handleConfirmMarkAvailableWithoutNote = async () => {
    if (currentEmployee) {
      await toggleEmployeeLeave(currentEmployee, false, null);
      setMarkAvailableDialogOpen(false);
    }
  };

  const handleRetry = () => {
    fetchEmployees();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 space-y-6">
        {/* Compact Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-white shadow-xl animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl transform -translate-x-8 translate-y-8"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {t("employees.title")} ({employees.length})
              </h1>
              <p className="text-blue-100 font-medium">
                {t("employees.description")} - Now with improved data loading
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button
                  onClick={handleCreateNew}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("employees.addEmployee")}
                </Button>
              )}
              <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Employees Content - Compact Table Layout */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4">
            <EmployeeList 
              employees={employees}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleLeave={handleToggleLeave}
              error={error}
              loading={loading}
              onRetry={handleRetry}
            />
          </div>
        </div>

        {/* Use the correct dialog components with proper props */}
        <EmployeeFormDialog 
          open={!!currentEmployee || formData.name !== ''}
          employee={currentEmployee}
          onClose={() => prepareForCreate()}
          onSubmit={currentEmployee ? updateEmployee : createEmployee}
          formData={formData}
          onInputChange={handleInputChange}
          onSelectChange={handleSelectChange}
          onCheckboxChange={handleCheckboxChange}
        />

        <EmployeeDeleteDialog
          open={deleteDialogOpen}
          employee={currentEmployee}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
};

export default EmployeesPage;
