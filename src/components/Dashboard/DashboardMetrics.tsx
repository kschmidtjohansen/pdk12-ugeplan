import React from 'react';
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

  // For the demo, assume half of vehicles are available
  const availableVehicles = Math.floor(cars.length / 2);
  const totalVehicles = cars.length;
  return <div className="space-y-6">
      {/* System metrics overview */}
      <SystemMetricsOverview assignments={assignments} upcomingVacations={upcomingVacations} availableVehicles={availableVehicles} totalVehicles={totalVehicles} />
      
      {/* Charts and widgets */}
      
    </div>;
};
export default DashboardMetrics;