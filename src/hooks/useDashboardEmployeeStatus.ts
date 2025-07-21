import { useEffect } from 'react';
import { useEmployeeActions } from './employee/useEmployeeActions';

/**
 * Custom hook to handle employee leave status updates for the dashboard
 */
export const useDashboardEmployeeStatus = () => {
  const { updateEmployeeLeaveStatusFromVacations } = useEmployeeActions(() => Promise.resolve());

  useEffect(() => {
    const updateEmployeeStatuses = async () => {
      await updateEmployeeLeaveStatusFromVacations();
    };
    
    // Update status on load
    updateEmployeeStatuses();
    
    // Also set up an interval to periodically check for employee status changes
    // This ensures employees are properly marked as available when their vacation ends
    const intervalId = setInterval(() => {
      updateEmployeeStatuses();
    }, 30 * 60 * 1000); // Check every 30 minutes
    
    return () => {
      clearInterval(intervalId);
    };
  }, [updateEmployeeLeaveStatusFromVacations]);
};