
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useVacations } from '@/hooks/useVacations';
import { useCars } from '@/hooks/useCars';
import SystemMetricsOverview from './SystemMetricsOverview';
import UpcomingVacationsWidget from './UpcomingVacationsWidget';
import VehicleStatusWidget from './VehicleStatusWidget';
import { format } from 'date-fns';

const DashboardMetrics: React.FC = () => {
  const {
    t
  } = useTranslation();
  const {
    assignments
  } = usePlannerAssignments();
  const {
    vacations
  } = useVacations();
  const {
    cars
  } = useCars();

  // Calculate metrics for the dashboard
  const upcomingVacations = vacations.filter(v => v.status === 'approved' && new Date(v.startDate) >= new Date()).length;

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  // Calculate available vehicles based on assignments for today
  const carsInUseToday = new Set();
  assignments.forEach(assignment => {
    if (assignment.date === today && assignment.car) {
      carsInUseToday.add(assignment.car);
    }
  });

  const availableVehicles = cars.length - carsInUseToday.size;
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle status widget */}
        <div>
          <VehicleStatusWidget 
            availableVehicles={availableVehicles} 
            totalVehicles={totalVehicles} 
            cars={cars}
            assignments={assignments}
          />
        </div>
        
        {/* Upcoming vacations widget */}
        <div>
          <UpcomingVacationsWidget 
            vacations={vacations.filter(v => v.status === 'approved')} 
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;
