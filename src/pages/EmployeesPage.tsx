
import React, { useState } from 'react';
import PageHeader from '../components/Layout/PageHeader';
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
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markLeaveDialogOpen, setMarkLeaveDialogOpen] = useState(false);
  const [markAvailableDialogOpen, setMarkAvailableDialogOpen] = useState(false);
  const [employeeNote, setEmployeeNote] = useState('');
  
  const {
    employees,
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

  return (
    <div className="space-y-8">
      {/* Enhanced Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white shadow-large animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t("employees.title")}
            </h1>
            <p className="text-blue-100 text-lg">
              {t("employees.description")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <div className="p-3 rounded-xl bg-white/10">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Content */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <EmployeesList 
          employees={employees} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          onToggleLeave={handleToggleLeave}
        />
      </div>

      <EmployeeDialogManager
        dialogOpen={dialogOpen}
        deleteDialogOpen={deleteDialogOpen}
        markLeaveDialogOpen={markLeaveDialogOpen}
        markAvailableDialogOpen={markAvailableDialogOpen}
        currentEmployee={currentEmployee}
        formData={formData}
        employeeNote={employeeNote}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleCheckboxChange={handleCheckboxChange}
        handleNoteChange={setEmployeeNote}
        handleSubmit={handleSubmit}
        onCloseDialog={() => setDialogOpen(false)}
        onConfirmDelete={confirmDelete}
        onCloseDeleteDialog={setDeleteDialogOpen}
        onConfirmMarkLeave={handleConfirmMarkLeave}
        onCancelMarkLeave={() => setMarkLeaveDialogOpen(false)}
        onConfirmMarkAvailableWithNote={handleConfirmMarkAvailableWithNote}
        onConfirmMarkAvailableWithoutNote={handleConfirmMarkAvailableWithoutNote}
        onCancelMarkAvailable={() => setMarkAvailableDialogOpen(false)}
      />
    </div>
  );
};

export default EmployeesPage;
