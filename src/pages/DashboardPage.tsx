
import React from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/Layout/PageHeader';
import ServicemedarbejderDashboard from '@/components/Dashboard/ServicemedarbejderDashboard';
import ManagementDashboard from '@/components/Dashboard/ManagementDashboard';
import { useDashboardEmployeeStatus } from '@/hooks/useDashboardEmployeeStatus';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  // Update employee leave status based on vacations when dashboard loads
  useDashboardEmployeeStatus();

  // Determine which dashboard to show based on user role
  const isServicemedarbejder = user?.role === 'servicemedarbejder';

  return (
    <>
      {isServicemedarbejder ? (
        <ServicemedarbejderDashboard />
      ) : (
        <ManagementDashboard />
      )}
    </>
  );
};

export default DashboardPage;
