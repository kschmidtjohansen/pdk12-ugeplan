
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
    toggleEmployeeLeave(employee);
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
        currentEmployee={currentEmployee}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleCheckboxChange={handleCheckboxChange}
        handleSubmit={handleSubmit}
        onCloseDialog={() => setDialogOpen(false)}
        onConfirmDelete={confirmDelete}
        onCloseDeleteDialog={setDeleteDialogOpen}
      />
    </>
  );
};

export default EmployeesPage;
