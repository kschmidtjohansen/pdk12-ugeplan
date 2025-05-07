
import React from 'react';
import SystemMetricsOverview from './SystemMetricsOverview';
import AssignmentChart from './AssignmentChart';
import UpcomingVacations from './UpcomingVacations';
import VehicleStatus from './VehicleStatus';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <SystemMetricsOverview />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AssignmentChart />
        <UpcomingVacations />
        <VehicleStatus />
      </div>
    </div>
  );
};

export default Dashboard;
