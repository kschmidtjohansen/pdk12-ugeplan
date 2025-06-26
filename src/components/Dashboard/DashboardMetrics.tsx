
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

  console.log('[DashboardMetrics] METRICS FIX - Showing metrics to ALL users');

  const targetDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
  const targetDateObj = new Date(targetDate + 'T12:00:00');

  console.log(`[DashboardMetrics] METRICS FIX - Calculating metrics for date: ${targetDate}`);
  console.log(`[DashboardMetrics] Total employees: ${employees.length}`);
  console.log(`[DashboardMetrics] Total assignments: ${assignments.length}`);
  console.log(`[DashboardMetrics] Total vacations: ${vacations.length}`);

  const allEmployees = employees;

  console.log(`[DashboardMetrics] METRICS FIX - All employees visible: ${allEmployees.length}`);

  // METRICS FIX: Available employees (available OR partially booked)
  const availableEmployees = allEmployees.filter(employee => {
    console.log(`[DashboardMetrics] METRICS FIX - Checking availability for ${employee.name}`);
    
    const availabilityInfo = getEmployeeAvailabilityStatus(
      employee,
      targetDateObj,
      assignments,
      vacations,
      t
    );
    
    const isAvailable = availabilityInfo.status === 'available' || availabilityInfo.status === 'partiallyBooked';
    console.log(`[DashboardMetrics] METRICS FIX - Employee ${employee.name}: status=${availabilityInfo.status}, available=${isAvailable}`);
    
    return isAvailable;
  });

  // METRICS FIX: Unavailable employees (fully booked, on leave, on vacation, OR partial vacation)
  const unavailableEmployees = allEmployees.filter(employee => {
    console.log(`[DashboardMetrics] METRICS FIX - Checking unavailability for ${employee.name}`);
    
    const availabilityInfo = getEmployeeAvailabilityStatus(
      employee,
      targetDateObj,
      assignments,
      vacations,
      t
    );
    
    const isUnavailable = availabilityInfo.status === 'fullyBooked' || 
                         availabilityInfo.status === 'onLeave' || 
                         availabilityInfo.status === 'onVacation' ||
                         availabilityInfo.status === 'partialVacation';
    
    console.log(`[DashboardMetrics] METRICS FIX - Employee ${employee.name}: status=${availabilityInfo.status}, unavailable=${isUnavailable}`);
    
    return isUnavailable;
  });

  console.log(`[DashboardMetrics] METRICS FIX - Available employees: ${availableEmployees.length}`);
  availableEmployees.forEach(emp => console.log(`  - ${emp.name} (available/partial)`));
  console.log(`[DashboardMetrics] METRICS FIX - Unavailable employees: ${unavailableEmployees.length}`);
  unavailableEmployees.forEach(emp => console.log(`  - ${emp.name} (booked/leave/vacation)`));

  // METRICS FIX: Car calculations based on actual assignment usage
  const carsInUseOnDate = new Set<string>();
  assignments
    .filter(a => a.date === targetDate)
    .forEach(assignment => {
      // Handle both single car and multiple cars
      if (assignment.car) {
        const carId = typeof assignment.car === 'string' ? assignment.car : assignment.car.id;
        if (carId) {
          carsInUseOnDate.add(carId);
        }
      }
      if (assignment.cars && Array.isArray(assignment.cars)) {
        assignment.cars.forEach(carId => {
          if (carId) {
            carsInUseOnDate.add(carId);
          }
        });
      }
    });

  // METRICS FIX: Available cars = NOT in use today AND marked as available
  const availableCars = cars.filter(car => 
    car.is_available && !carsInUseOnDate.has(car.id)
  ).length;

  // METRICS FIX: Cars in use = assigned to tasks today OR marked as unavailable
  const carsInUse = cars.filter(car => 
    carsInUseOnDate.has(car.id) || !car.is_available
  ).length;

  console.log(`[DashboardMetrics] METRICS FIX - Car calculations:`, {
    totalCars: cars.length,
    carsInUseFromAssignments: carsInUseOnDate.size,
    availableCars: availableCars,
    carsInUse: carsInUse,
    carsInUseToday: Array.from(carsInUseOnDate)
  });

  const handleAvailabilityDialogOpen = () => {
    console.log(`[DashboardMetrics] METRICS FIX - Opening availability dialog with ${availableEmployees.length} employees`);
    setAvailabilityDialogOpen(true);
  };

  const handleUnavailableDialogOpen = () => {
    console.log(`[DashboardMetrics] METRICS FIX - Opening unavailable dialog with ${unavailableEmployees.length} employees`);
    setUnavailableDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('dashboard.metrics.availableEmployees')}
          value={availableEmployees.length}
          subtitle={`${allEmployees.length} ${t('admin.quickStats.total')}`}
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
          value={carsInUse}
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
