
import React, { useState } from 'react';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

// Import custom components and hooks
import EmployeesTable from '../components/Employees/EmployeesTable';
import EmployeeDialogManager from '../components/Employees/EmployeeDialogManager';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { Employee } from '@/types/employee';

const EmployeesPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markLeaveDialogOpen, setMarkLeaveDialogOpen] = useState(false);
  const [markAvailableDialogOpen, setMarkAvailableDialogOpen] = useState(false);
  const [employeeNote, setEmployeeNote] = useState('');
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    role: 'servicemedarbejder' as 'servicemedarbejder',
    onLeave: false,
    notes: ''
  });

  // Use unified data service
  const { 
    employees, 
    loading, 
    error,
    fetchEmployees 
  } = useUnifiedData();

  const prepareForCreate = () => {
    setCurrentEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      jobTitle: '',
      role: 'servicemedarbejder',
      onLeave: false,
      notes: ''
    });
  };

  const prepareForEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      jobTitle: employee.jobTitle || '',
      role: employee.role as 'servicemedarbejder',
      onLeave: employee.onLeave,
      notes: employee.notes || ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as 'servicemedarbejder',
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

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
      // TODO: Implement delete functionality
      console.log('Delete employee:', currentEmployee.id);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: Implement create/update functionality
      console.log('Submit employee:', formData);
      setDialogOpen(false);
      await fetchEmployees(); // Refresh data
    } catch (error) {
      console.error('[EmployeesPage] Submit error:', error);
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

  const handleConfirmMarkLeave = () => {
    if (currentEmployee) {
      // TODO: Implement toggle leave functionality
      console.log('Mark leave:', currentEmployee.id, employeeNote);
      setMarkLeaveDialogOpen(false);
    }
  };

  const handleConfirmMarkAvailableWithNote = () => {
    if (currentEmployee) {
      // TODO: Implement toggle available functionality
      console.log('Mark available (keep note):', currentEmployee.id);
      setMarkAvailableDialogOpen(false);
    }
  };

  const handleConfirmMarkAvailableWithoutNote = () => {
    if (currentEmployee) {
      // TODO: Implement toggle available functionality
      console.log('Mark available (remove note):', currentEmployee.id);
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
    </div>
  );
};

export default EmployeesPage;
