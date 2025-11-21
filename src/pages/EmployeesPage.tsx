
import React, { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Users, UserPlus } from 'lucide-react';
import EmployeesTable from '@/components/Employees/EmployeesTable';
import EmployeeFormDialog from '@/components/Employees/EmployeeFormDialog';
import EmployeeDeleteDialog from '@/components/Employees/EmployeeDeleteDialog';
import { MarkSickDialog } from '@/components/Employees/MarkSickDialog';
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
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [markSickDialogOpen, setMarkSickDialogOpen] = useState(false);
  const [selectedEmployeeForSick, setSelectedEmployeeForSick] = useState<Employee | null>(null);

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

  const handleMarkSick = async (employee: Employee) => {
    if (employee.isSick) {
      // Employee is already sick, so this should mark them as recovered
      try {
        // Find their active sick leave record
        const { data: sickLeave } = await supabase
          .from('sick_leave_records')
          .select('id')
          .eq('user_id', employee.id)
          .is('end_date', null)
          .maybeSingle();
        
        if (sickLeave) {
          // Call end_sick_leave with today as end date
          const { error } = await supabase.rpc('end_sick_leave', {
            p_record_id: sickLeave.id,
            p_end_date: format(new Date(), 'yyyy-MM-dd')
          });
          
          if (error) throw error;
          
          toast({
            title: "Medarbejder raskmeldt",
            description: `${employee.name} er markeret som rask`,
          });
          
          fetchEmployees(); // Refresh list
        }
      } catch (error) {
        console.error('Error marking as recovered:', error);
        toast({
          title: "Fejl",
          description: "Kunne ikke raskmelde medarbejder. Prøv igen.",
          variant: "destructive"
        });
      }
    } else {
      // Employee is not sick, show dialog to mark them as sick
      setSelectedEmployeeForSick(employee);
      setMarkSickDialogOpen(true);
    }
  };

  const handleConfirmMarkSick = async (startDate: Date, notes: string) => {
    if (!selectedEmployeeForSick) return;

    try {
      const { data, error } = await supabase.rpc('record_sick_leave', {
        p_user_id: selectedEmployeeForSick.id,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Sygdom registreret",
        description: `${selectedEmployeeForSick.name} er markeret som syg fra ${format(startDate, 'PPP', { locale: da })}`,
      });
      
      fetchEmployees(); // Refresh list
    } catch (error) {
      console.error('Error recording sick leave:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke registrere sygdom. Prøv igen.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Simple Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {regularEmployees.length} {t("employees.title")} - {vikarer.length} Vikarer
            </h1>
            <p className="text-gray-600">
              {t("employees.description")}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                {t("employees.addEmployee")}
              </Button>
              <Button onClick={handleCreateVikar} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                {t("employees.addVikar")}
              </Button>
            </div>
          )}
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg border shadow-sm">
          <EmployeesTable 
            employees={employees}
            vacations={vacations}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleLeave={handleToggleLeave}
            onMarkSick={isAdmin ? handleMarkSick : undefined}
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

        {/* Mark Sick Dialog */}
        <MarkSickDialog
          open={markSickDialogOpen}
          onOpenChange={setMarkSickDialogOpen}
          employee={selectedEmployeeForSick}
          onConfirm={handleConfirmMarkSick}
        />
      </div>
    </div>
  );
};

export default EmployeesPage;
