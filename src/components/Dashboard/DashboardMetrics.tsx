
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useVacations } from '@/hooks/useVacations';
import { useCars } from '@/hooks/useCars';
import SystemMetricsOverview from './SystemMetricsOverview';
import AssignmentDistributionChart from './AssignmentDistributionChart';
import UpcomingVacationsWidget from './UpcomingVacationsWidget';
import VehicleStatusWidget from './VehicleStatusWidget';

const DashboardMetrics: React.FC = () => {
  const {
    t
  } = useTranslation();
  const {
    assignments,
    isLoading: assignmentsLoading
  } = usePlannerAssignments();
  const {
    vacations,
    isLoading: vacationsLoading
  } = useVacations();
  const {
    cars,
    isLoading: carsLoading
  } = useCars();

  // Loading state for the entire component
  const [isLoading, setIsLoading] = useState(true);

  // Update loading state when all data is loaded
  useEffect(() => {
    if (!assignmentsLoading && !vacationsLoading && !carsLoading) {
      setIsLoading(false);
    }
  }, [assignmentsLoading, vacationsLoading, carsLoading]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard data...</div>;
  }

  // Calculate metrics for the dashboard
  const upcomingVacations = vacations.filter(v => 
    v.status === 'approved' && new Date(v.startDate) >= new Date()
  ).length;

  // For availability, count cars without active assignments today
  const today = new Date().toISOString().split('T')[0];
  const assignedCarNames = assignments
    .filter(a => a.date === today)
    .map(a => a.car);
  
  const availableVehicles = cars.filter(car => 
    !assignedCarNames.includes(car.name)
  ).length;
  
  const totalVehicles = cars.length;

  return (
    <div className="space-y-6">
      {/* System metrics overview */}
      <SystemMetricsOverview 
        assignments={assignments} 
        upcomingVacations={upcomingVacations} 
        availableVehicles={availableVehicles} 
        totalVehicles={totalVehicles} 
      />
      
      {/* Charts and widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssignmentDistributionChart assignments={assignments} />
        <div className="space-y-6">
          <UpcomingVacationsWidget />
          <VehicleStatusWidget availableVehicles={availableVehicles} totalVehicles={totalVehicles} />
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;
