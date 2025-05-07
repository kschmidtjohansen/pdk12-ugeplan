
import React, { useState } from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { usePermissions } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Dialog } from "@/components/ui/dialog";
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';
import { useVacations } from '../hooks/useVacations';

// Import custom components
import EmployeesList, { Employee } from '../components/Employees/EmployeesList';
import EmployeeFormDialog from '../components/Employees/EmployeeFormDialog';
import EmployeeDeleteDialog from '../components/Employees/EmployeeDeleteDialog';

// Mock data
const initialEmployees = [{
  id: '1',
  name: 'John Doe',
  email: 'john.doe@polygon.com',
  phone: '+45 12 34 56 78',
  jobTitle: 'Senior Technician',
  role: 'skadeleder',
  onLeave: false,
  notes: 'Team leader for water damage projects.'
}, {
  id: '2',
  name: 'Jane Smith',
  email: 'jane.smith@polygon.com',
  phone: '+45 23 45 67 89',
  jobTitle: 'Technician',
  role: 'servicemedarbejder',
  onLeave: true,
  notes: 'On parental leave until 2025-06-01.'
}, {
  id: '3',
  name: 'Mike Johnson',
  email: 'mike.johnson@polygon.com',
  phone: '+45 34 56 78 90',
  jobTitle: 'Project Manager',
  role: 'administrator',
  onLeave: false,
  notes: 'Main admin for the system.'
}, {
  id: '4',
  name: 'Anna Williams',
  email: 'anna.williams@polygon.com',
  phone: '+45 45 67 89 01',
  jobTitle: 'Junior Technician',
  role: 'servicemedarbejder',
  onLeave: false,
  notes: 'New hire, needs training on water damage assessment.'
}];

const EmployeesPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { vacations } = useVacations();
  const [employees, setEmployees] = useState(initialEmployees);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    role: '',
    onLeave: false,
    notes: ''
  });

  const handleCreateNew = () => {
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
    setDialogOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      jobTitle: employee.jobTitle,
      role: employee.role,
      onLeave: employee.onLeave || false,
      notes: employee.notes || ''
    });
    setDialogOpen(true);
  };
  
  const handleDelete = (employee: Employee) => {
    setCurrentEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (currentEmployee) {
      setEmployees(employees.filter(e => e.id !== currentEmployee.id));
      toast({
        title: t("employees.employeeDeleted"),
        description: t("employees.employeeDeletedMsg", { name: currentEmployee.name })
      });
      setDeleteDialogOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentEmployee) {
      // Update existing
      setEmployees(employees.map(e => e.id === currentEmployee.id ? {
        ...e,
        ...formData
      } : e));
      toast({
        title: t("employees.employeeUpdated"),
        description: t("employees.employeeUpdatedMsg", {
          name: formData.name
        })
      });
    } else {
      // Create new
      const newEmployee = {
        ...formData,
        id: Date.now().toString()
      };
      setEmployees([...employees, newEmployee]);
      toast({
        title: t("employees.employeeAdded"),
        description: t("employees.employeeAddedMsg", {
          name: formData.name
        })
      });
    }
    setDialogOpen(false);
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
        vacations={vacations}
      />

      {/* Employee Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <EmployeeFormDialog
          currentEmployee={currentEmployee}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          handleSubmit={handleSubmit}
          onClose={() => setDialogOpen(false)}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <EmployeeDeleteDialog
          employee={currentEmployee}
          onConfirmDelete={confirmDelete}
        />
      </AlertDialog>
    </>
  );
};

export default EmployeesPage;
