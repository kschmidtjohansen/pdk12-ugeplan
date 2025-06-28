
import React, { useState } from 'react';
import { Users, Car } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions, useAuth } from '@/context/AuthContext';
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
  const { user } = useAuth();
  const { t } = useTranslation();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();
  
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [unavailableDialogOpen, setUnavailableDialogOpen] = useState(false);

  console.log('[DashboardMetrics] ROLE CHECK - User role check:', {
    userRole: user?.role,
    isAdmin,
    isSkadeleder,
    shouldShowMetrics: isAdmin || isSkadeleder
  });

  // Only show metrics for admin and skadeleder
  if (!isAdmin && !isSkadeleder) {
    console.log('[DashboardMetrics] ROLE CHECK - Hiding metrics for servicemedarbejder user');
    return null;
  }

  const targetDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
  const targetDateObj = new Date(targetDate + 'T12:00:00');

  const allEmployees = employees;

  // Available employees (available OR partially booked)
  const availableEmployees = allEmployees.filter(employee => {
    const availabilityInfo = getEmployeeAvailabilityStatus(
      employee,
      targetDateObj,
      assignments,
      vacations,
      t
    );
    
    const isAvailable = availabilityInfo.status === 'available' || availabilityInfo.status === 'partiallyBooked';
    return isAvailable;
  });

  // Unavailable employees (fully booked, on leave, on vacation, OR partial vacation)
  const unavailableEmployees = allEmployees.filter(employee => {
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
    
    return isUnavailable;
  });

  // Car calculations
  const carsInUseOnDate = new Set<string>();
  assignments
    .filter(a => a.date === targetDate)
    .forEach(assignment => {
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

  const availableCars = cars.filter(car => 
    car.is_available && !carsInUseOnDate.has(car.id)
  ).length;

  const carsInUse = cars.filter(car => 
    carsInUseOnDate.has(car.id) || !car.is_available
  ).length;

  const handleAvailabilityDialogOpen = () => {
    setAvailabilityDialogOpen(true);
  };

  const handleUnavailableDialogOpen = () => {
    setUnavailableDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('dashboard.metrics.availableEmployees')}
          value={availableEmployees.length}
          subtitle={t('dashboard.metrics.totalCount', { count: allEmployees.length })}
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
          subtitle={t('dashboard.metrics.totalCount', { count: cars.length })}
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
