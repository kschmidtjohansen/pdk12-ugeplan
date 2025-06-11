import React, { useState } from 'react';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

// Import custom components and hooks
import EmployeesList from '../components/Employees/EmployeesList';
import EmployeeDialogManager from '../components/Employees/EmployeeDialogManager';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/types/employee';
const EmployeesPage: React.FC = () => {
  const {
    isAdmin
  } = usePermissions();
  const {
    t
  } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markLeaveDialogOpen, setMarkLeaveDialogOpen] = useState(false);
  const [markAvailableDialogOpen, setMarkAvailableDialogOpen] = useState(false);
  const [employeeNote, setEmployeeNote] = useState('');
  const {
    employees,
    loading,
    error,
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
    setDialogOpen(true);
  };
  const handleEdit = (employee: Employee) => {
    prepareForEdit(employee);
    setDialogOpen(true);
  };
  const handleDelete = (employee: Employee) => {
    prepareForEdit(employee);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (currentEmployee) {
      deleteEmployee(currentEmployee.id);
      setDeleteDialogOpen(false);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentEmployee) {
      updateEmployee();
    } else {
      createEmployee();
    }
    setDialogOpen(false);
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
  const handleConfirmMarkLeave = () => {
    if (currentEmployee) {
      toggleEmployeeLeave(currentEmployee, true, employeeNote);
      setMarkLeaveDialogOpen(false);
    }
  };
  const handleConfirmMarkAvailableWithNote = () => {
    if (currentEmployee) {
      toggleEmployeeLeave(currentEmployee, false, currentEmployee.notes);
      setMarkAvailableDialogOpen(false);
    }
  };
  const handleConfirmMarkAvailableWithoutNote = () => {
    if (currentEmployee) {
      toggleEmployeeLeave(currentEmployee, false, '');
      setMarkAvailableDialogOpen(false);
    }
  };

  // Add retry function for error handling
  const handleRetry = () => {
    window.location.reload(); // Simple retry by reloading the page
  };
  return <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-8">
        {/* Enhanced Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white shadow-2xl animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {t("employees.title")}
              </h1>
              <p className="text-blue-100 text-lg font-medium">
                {t("employees.description")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin}
              <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Employees Content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6">
            <EmployeesList employees={employees} onEdit={handleEdit} onDelete={handleDelete} onToggleLeave={handleToggleLeave} error={error} loading={loading} onRetry={handleRetry} />
          </div>
        </div>

        <EmployeeDialogManager dialogOpen={dialogOpen} deleteDialogOpen={deleteDialogOpen} markLeaveDialogOpen={markLeaveDialogOpen} markAvailableDialogOpen={markAvailableDialogOpen} currentEmployee={currentEmployee} formData={formData} employeeNote={employeeNote} handleInputChange={handleInputChange} handleSelectChange={handleSelectChange} handleCheckboxChange={handleCheckboxChange} handleNoteChange={setEmployeeNote} handleSubmit={handleSubmit} onCloseDialog={() => setDialogOpen(false)} onConfirmDelete={confirmDelete} onCloseDeleteDialog={setDeleteDialogOpen} onConfirmMarkLeave={handleConfirmMarkLeave} onCancelMarkLeave={() => setMarkLeaveDialogOpen(false)} onConfirmMarkAvailableWithNote={handleConfirmMarkAvailableWithNote} onConfirmMarkAvailableWithoutNote={handleConfirmMarkAvailableWithoutNote} onCancelMarkAvailable={() => setMarkAvailableDialogOpen(false)} />
      </div>
    </div>;
};
export default EmployeesPage;