
import React, { useState } from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
      // Update existing
      updateEmployee();
    } else {
      // Create new
      createEmployee();
    }
    
    setDialogOpen(false);
  };

  const handleToggleLeave = (employee: Employee) => {
    if (!isAdmin) return;
    
    prepareForEdit(employee);
    
    // If employee is already on leave, show the available dialog
    if (employee.onLeave) {
      setMarkAvailableDialogOpen(true);
      setEmployeeNote(employee.notes || '');
    } else {
      // If employee is not on leave, show the leave dialog
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
    <>
      <PageHeader title={t("employees.title")} description={t("employees.description")}>
        {isAdmin && (
          <Button onClick={handleCreateNew} className="bg-polygon-blue hover:bg-polygon-darkblue">
            <Plus className="mr-2 h-4 w-4" /> {t("employees.addEmployee")}
          </Button>
        )}
      </PageHeader>

      <EmployeesList 
        employees={employees} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        onToggleLeave={handleToggleLeave}
      />

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
    </>
  );
};

export default EmployeesPage;
