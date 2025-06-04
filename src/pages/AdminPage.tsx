
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { useAssignmentsConsolidated } from '@/hooks/useAssignmentsConsolidated';
import { Employee } from '@/types/employee';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import AssignmentWidget from '@/components/Dashboard/AssignmentWidget';
import PageHeader from '@/components/Layout/PageHeader';
import QuickStatsGrid from '@/components/Admin/QuickStatsGrid';
import EmployeeManagementTabs from '@/components/Admin/EmployeeManagementTabs';
import VacationManagement from '@/components/Admin/VacationManagement';
import CarManagement from '@/components/Admin/CarManagement';
import { format } from 'date-fns';
import { getAllCarIds } from '@/utils/carHelpers';

const AdminPage: React.FC = () => {
  const { isAdmin, isSkadeleder } = usePermissions();
  const { t } = useTranslation();
  const { employees, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { cars, createCar, updateCar, deleteCar } = useCars();
  const { vacations, approveVacation, denyVacation } = useVacations();
  const { assignments } = useAssignmentsConsolidated({ filter: 'all' });

  if (!isAdmin && !isSkadeleder) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.accessDenied')}</p>
      </div>
    );
  }

  // Helper function to filter service employees
  const serviceEmployees = employees.filter((employee: Employee) => employee.role === 'servicemedarbejder');

  // Get today's date in YYYY-MM-DD format for filtering assignments
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Calculate assigned employees for today
  const assignedToday = new Set();
  assignments.forEach(assignment => {
    if (assignment.date === today && assignment.employees) {
      assignment.employees.forEach(employeeName => {
        assignedToday.add(employeeName);
      });
    }
  });

  // Calculate cars in use today
  const carsInUseToday = assignments
    .filter(assignment => assignment.date === today && assignment.car)
    .reduce((uniqueCars, assignment) => {
      const carIds = getAllCarIds(assignment.car);
      carIds.forEach(carId => {
        if (carId && !uniqueCars.includes(carId)) {
          uniqueCars.push(carId);
        }
      });
      return uniqueCars;
    }, [] as string[]).length;

  const availableCars = cars.filter(car => car.is_available).length;

  const todayAssignments = assignments.filter(assignment => assignment.date === today);

  const quickStats = {
    totalEmployees: serviceEmployees.length,
    availableEmployees: serviceEmployees.filter(emp => !emp.onLeave && !assignedToday.has(emp.name)).length,
    totalCars: cars.length,
    availableCars: availableCars,
    carsInUse: carsInUseToday,
    pendingVacations: vacations.filter(vacation => vacation.status === 'pending').length,
    todayAssignments: todayAssignments.length
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title={t('admin.title')}
        subtitle={t('admin.subtitle')}
      />

      <QuickStatsGrid stats={quickStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <EmployeeManagementTabs
              employees={employees}
              onCreateEmployee={createEmployee}
              onUpdateEmployee={updateEmployee}
              onDeleteEmployee={deleteEmployee}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <VacationManagement
              vacations={vacations}
              onApprove={approveVacation}
              onDeny={denyVacation}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <CarManagement
            cars={cars}
            onCreateCar={createCar}
            onUpdateCar={updateCar}
            onDeleteCar={deleteCar}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('admin.todayAssignments')}</h3>
          <AssignmentWidget
            assignments={todayAssignments}
            showDateFilter={false}
            title={t('admin.todayAssignments')}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
