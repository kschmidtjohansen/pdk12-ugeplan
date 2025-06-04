import React, { useState } from 'react';
import { Users, Car } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { format } from 'date-fns';
import EmployeeAvailabilityDialog from './EmployeeAvailabilityDialog';
import MetricCard from './MetricCard';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';
import { Assignment } from '@/types/assignment';

interface DashboardMetricsProps {
  selectedDate?: string;
  assignments: Assignment[];
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ selectedDate, assignments }) => {
  const { isAdmin, isSkadeleder } = usePermissions();
  const { t } = useTranslation();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();
  
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [unavailableDialogOpen, setUnavailableDialogOpen] = useState(false);

  // Only show for admin or skadeleder
  if (!isAdmin && !isSkadeleder) {
    return null;
  }

  // Use selectedDate prop or default to today
  const targetDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
  const targetDateObj = new Date(targetDate + 'T12:00:00');

  console.log(`[DashboardMetrics] === CALCULATING AVAILABILITY FOR DATE: ${targetDate} ===`);
  console.log(`[DashboardMetrics] Total employees: ${employees.length}`);
  console.log(`[DashboardMetrics] Total assignments: ${assignments.length}`);
  console.log(`[DashboardMetrics] Total vacations: ${vacations.length}`);

  // Filter employees to only include servicemedarbejder role and add detailed logging
  const serviceEmployees = employees.filter(employee => {
    const isService = employee.role === 'servicemedarbejder';
    console.log(`[DashboardMetrics] Employee ${employee.name}: role=${employee.role}, isService=${isService}, onLeave=${employee.onLeave}`);
    return isService;
  });

  console.log(`[DashboardMetrics] Service employees: ${serviceEmployees.length}`);

  // Calculate available employees (including partially available) with detailed logging
  const availableEmployees = serviceEmployees.filter(employee => {
    console.log(`[DashboardMetrics] === Checking availability for ${employee.name} ===`);
    
    const availabilityInfo = getEmployeeAvailabilityStatus(
      employee,
      targetDateObj,
      assignments,
      vacations,
      t
    );
    
    const isAvailable = availabilityInfo.status === 'available' || availabilityInfo.status === 'partiallyBooked';
    console.log(`[DashboardMetrics] Employee ${employee.name}: status=${availabilityInfo.status}, available=${isAvailable}, statusText="${availabilityInfo.statusText}"`);
    
    return isAvailable;
  });

  // Calculate unavailable employees (fully booked, on leave, on vacation) with detailed logging
  const unavailableEmployees = serviceEmployees.filter(employee => {
    console.log(`[DashboardMetrics] === Checking unavailability for ${employee.name} ===`);
    
    const availabilityInfo = getEmployeeAvailabilityStatus(
      employee,
      targetDateObj,
      assignments,
      vacations,
      t
    );
    
    const isUnavailable = availabilityInfo.status === 'fullyBooked' || 
                         availabilityInfo.status === 'onLeave' || 
                         availabilityInfo.status === 'onVacation';
    
    console.log(`[DashboardMetrics] Employee ${employee.name}: status=${availabilityInfo.status}, unavailable=${isUnavailable}, statusText="${availabilityInfo.statusText}"`);
    
    return isUnavailable;
  });

  console.log(`[DashboardMetrics] === FINAL RESULTS ===`);
  console.log(`[DashboardMetrics] Available employees: ${availableEmployees.length}`);
  availableEmployees.forEach(emp => console.log(`  - ${emp.name}`));
  console.log(`[DashboardMetrics] Unavailable employees: ${unavailableEmployees.length}`);
  unavailableEmployees.forEach(emp => console.log(`  - ${emp.name}`));

  // Calculate cars in use on target date
  const carsInUseOnDate = assignments
    .filter(a => a.date === targetDate && a.car)
    .reduce((uniqueCars, assignment) => {
      const carId = typeof assignment.car === 'string' ? assignment.car : assignment.car?.id;
      if (carId && !uniqueCars.includes(carId)) {
        uniqueCars.push(carId);
      }
      return uniqueCars;
    }, [] as string[]).length;

  const availableCars = cars.filter(car => car.is_available).length;

  // Add logging before dialog opens
  const handleAvailabilityDialogOpen = () => {
    console.log(`[DashboardMetrics] === OPENING AVAILABILITY DIALOG ===`);
    console.log(`[DashboardMetrics] Passing ${availableEmployees.length} available employees to dialog:`);
    availableEmployees.forEach(emp => console.log(`  - ${emp.name} (${emp.id})`));
    console.log(`[DashboardMetrics] Target date: ${targetDate}`);
    console.log(`[DashboardMetrics] Assignments being passed: ${assignments.length}`);
    console.log(`[DashboardMetrics] Vacations being passed: ${vacations.length}`);
    setAvailabilityDialogOpen(true);
  };

  const handleUnavailableDialogOpen = () => {
    console.log(`[DashboardMetrics] === OPENING UNAVAILABLE DIALOG ===`);
    console.log(`[DashboardMetrics] Passing ${unavailableEmployees.length} unavailable employees to dialog:`);
    unavailableEmployees.forEach(emp => console.log(`  - ${emp.name} (${emp.id})`));
    setUnavailableDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('dashboard.metrics.availableEmployees')}
          value={availableEmployees.length}
          subtitle={`${serviceEmployees.length} ${t('admin.quickStats.total')}`}
          icon={Users}
          color="green"
          onClick={handleAvailabilityDialogOpen}
        />
        
        <MetricCard
          title={t('dashboard.metrics.unavailableEmployees')}
          value={unavailableEmployees.length}
          subtitle={t('dashboard.metrics.unavailableSubtitle')}
          icon={Users}
          color="red"
          onClick={handleUnavailableDialogOpen}
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
          value={carsInUseOnDate}
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
        selectedDate={targetDate}
        title={t('dashboard.metrics.availableEmployees')}
      />

      {/* Unavailable Employees Dialog */}
      <EmployeeAvailabilityDialog
        open={unavailableDialogOpen}
        onOpenChange={setUnavailableDialogOpen}
        employees={unavailableEmployees}
        assignments={assignments}
        vacations={vacations}
        selectedDate={targetDate}
        title={t('dashboard.metrics.unavailableEmployees')}
      />
    </>
  );
};

export default DashboardMetrics;
