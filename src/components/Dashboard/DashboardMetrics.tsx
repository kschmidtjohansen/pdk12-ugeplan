
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
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';

interface DashboardMetricsProps {
  selectedDate?: string;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ selectedDate }) => {
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

  // Use selectedDate prop or default to today
  const targetDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
  const targetDateObj = new Date(targetDate + 'T12:00:00'); // Add time to avoid timezone issues

  console.log('[DashboardMetrics] === ENHANCED DEBUG INFO ===');
  console.log('[DashboardMetrics] Target date:', targetDate);
  console.log('[DashboardMetrics] Target date object:', targetDateObj);
  console.log('[DashboardMetrics] Total employees:', employees.length);
  console.log('[DashboardMetrics] Total assignments:', assignments.length);
  console.log('[DashboardMetrics] All employees:', employees.map(e => ({
    id: e.id,
    name: e.name,
    role: e.role,
    onLeave: e.onLeave
  })));

  // Filter employees to only include servicemedarbejder role
  const serviceEmployees = employees.filter(employee => {
    const isServiceEmployee = employee.role === 'servicemedarbejder';
    console.log(`[DashboardMetrics] Employee ${employee.name} - role: ${employee.role}, isServiceEmployee: ${isServiceEmployee}`);
    return isServiceEmployee;
  });

  console.log('[DashboardMetrics] Service employees:', serviceEmployees.length);
  console.log('[DashboardMetrics] Service employees details:', serviceEmployees.map(e => ({
    id: e.id,
    name: e.name,
    role: e.role,
    onLeave: e.onLeave
  })));

  // Log all assignments for debugging
  console.log('[DashboardMetrics] All assignments details:', assignments.map(a => ({
    id: a.id,
    date: a.date,
    location: a.location,
    employees: a.employees,
    employeeCount: a.employees?.length || 0,
    fromTime: a.fromTime,
    toTime: a.toTime
  })));

  // Calculate available employees (including partially available)
  const availableEmployees = serviceEmployees.filter(employee => {
    console.log(`[DashboardMetrics] === Checking availability for ${employee.name} ===`);
    
    const availabilityInfo = getEmployeeAvailabilityStatus(
      employee,
      targetDateObj,
      assignments,
      vacations,
      t
    );
    
    console.log(`[DashboardMetrics] Employee ${employee.name} availability status:`, availabilityInfo.status);
    
    // Include both available and partially booked employees
    const isAvailable = availabilityInfo.status === 'available' || availabilityInfo.status === 'partiallyBooked';
    console.log(`[DashboardMetrics] Employee ${employee.name} is included in available count:`, isAvailable);
    
    return isAvailable;
  });

  console.log('[DashboardMetrics] Available employees count:', availableEmployees.length);
  console.log('[DashboardMetrics] Available employees list:', availableEmployees.map(e => e.name));

  // Calculate unavailable employees (fully booked, on leave, on vacation)
  const unavailableEmployees = serviceEmployees.filter(employee => {
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
    
    console.log(`[DashboardMetrics] Employee ${employee.name} is unavailable:`, isUnavailable, 'Status:', availabilityInfo.status);
    
    return isUnavailable;
  });

  console.log('[DashboardMetrics] Unavailable employees count:', unavailableEmployees.length);
  console.log('[DashboardMetrics] Unavailable employees list:', unavailableEmployees.map(e => e.name));

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

  console.log('[DashboardMetrics] === FINAL METRICS ===');
  console.log('[DashboardMetrics] Total service employees:', serviceEmployees.length);
  console.log('[DashboardMetrics] Available employees:', availableEmployees.length);
  console.log('[DashboardMetrics] Unavailable employees:', unavailableEmployees.length);
  console.log('[DashboardMetrics] Available cars:', availableCars);
  console.log('[DashboardMetrics] Cars in use:', carsInUseOnDate);

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
