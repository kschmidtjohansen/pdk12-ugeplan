
import React, { useState } from 'react';
import { Users, Car } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { format } from 'date-fns';
import EmployeeAvailabilityDialog from './EmployeeAvailabilityDialog';
import MetricCard from './MetricCard';

const DashboardMetrics: React.FC = () => {
  const { isAdmin, isSkadeleder } = usePermissions();
  const { t } = useTranslation();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();
  const { assignments } = usePlannerAssignments();
  
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [unavailableDialogOpen, setUnavailableDialogOpen] = useState(false);

  // Only show for admin or skadeleder
  if (!isAdmin && !isSkadeleder) {
    return null;
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  // Filter employees to only include servicemedarbejder role
  const serviceEmployees = employees.filter(employee => employee.role === 'servicemedarbejder');

  // Helper function to check if an employee is on vacation today
  const isEmployeeOnVacationToday = (employeeId: string) => {
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    
    const isOnVacation = vacations.some(vacation => {
      if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
        return false;
      }
      
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return todayDate >= startDate && todayDate <= endDate;
    });
    
    return isOnVacation;
  };

  // Helper function to check if employee has assignments today
  const hasAssignmentsToday = (employeeId: string, employeeName: string) => {
    const todaysAssignments = assignments.filter(assignment => 
      assignment.date === today && 
      assignment.published &&
      assignment.employees && 
      assignment.employees.includes(employeeName)
    );
    
    return todaysAssignments.length > 0;
  };

  // Calculate available employees (filtered to servicemedarbejder only)
  const availableEmployees = serviceEmployees.filter(employee => {
    const isOnLeave = employee.onLeave;
    const isOnVacation = isEmployeeOnVacationToday(employee.id);
    const hasAssignments = hasAssignmentsToday(employee.id, employee.name);
    
    return !isOnLeave && !isOnVacation && !hasAssignments;
  });

  // Calculate unavailable employees (filtered to servicemedarbejder only)
  const unavailableEmployees = serviceEmployees.filter(employee => {
    const isOnLeave = employee.onLeave;
    const isOnVacation = isEmployeeOnVacationToday(employee.id);
    const hasAssignments = hasAssignmentsToday(employee.id, employee.name);
    
    return isOnLeave || isOnVacation || hasAssignments;
  });

  // Calculate cars in use today
  const carsInUseToday = assignments
    .filter(a => a.date === today && a.car)
    .reduce((uniqueCars, assignment) => {
      const carId = typeof assignment.car === 'string' ? assignment.car : assignment.car?.id;
      if (carId && !uniqueCars.includes(carId)) {
        uniqueCars.push(carId);
      }
      return uniqueCars;
    }, [] as string[]).length;

  const availableCars = cars.filter(car => car.is_available).length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('dashboard.metrics.availableEmployees')}
          value={availableEmployees.length}
          subtitle={`${serviceEmployees.length} ${t('admin.quickStats.total')}`}
          icon={Users}
          color="green"
          onClick={() => setAvailabilityDialogOpen(true)}
        />
        
        <MetricCard
          title={t('dashboard.metrics.unavailableEmployees')}
          value={unavailableEmployees.length}
          subtitle={t('dashboard.metrics.unavailableSubtitle')}
          icon={Users}
          color="red"
          onClick={() => setUnavailableDialogOpen(true)}
        />
        
        <MetricCard
          title={t('dashboard.metrics.availableCars')}
          value={availableCars}
          subtitle={`${cars.length} ${t('admin.quickStats.total')}`}
          icon={Car}
          color="blue"
        />
        
        <MetricCard
          title={t('dashboard.metrics.carsInUse')}
          value={carsInUseToday}
          subtitle={t('dashboard.metrics.carsInUseSubtitle')}
          icon={Car}
          color="orange"
        />
      </div>

      {/* Employee Availability Dialog */}
      <EmployeeAvailabilityDialog
        open={availabilityDialogOpen}
        onOpenChange={setAvailabilityDialogOpen}
        employees={availableEmployees}
        assignments={assignments}
        vacations={vacations}
        selectedDate={today}
        title={t('dashboard.metrics.availableEmployees')}
      />

      {/* Unavailable Employees Dialog */}
      <EmployeeAvailabilityDialog
        open={unavailableDialogOpen}
        onOpenChange={setUnavailableDialogOpen}
        employees={unavailableEmployees}
        assignments={assignments}
        vacations={vacations}
        selectedDate={today}
        title={t('dashboard.metrics.unavailableEmployees')}
      />
    </>
  );
};

export default DashboardMetrics;
