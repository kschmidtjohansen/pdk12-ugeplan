import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DemoUserService } from '@/services/demoUserService';

// Hook to automatically track demo operations
export const useDemoTracking = () => {
  const { user, isDemoMode } = useAuth();
  const demoService = DemoUserService.getInstance();

  // Track operation helper
  const trackOperation = async (
    table: string,
    operation: 'create' | 'update' | 'delete',
    recordId: string,
    originalData?: any
  ) => {
    if (isDemoMode && user) {
      await demoService.trackOperation(table, operation, recordId, originalData);
      demoService.updateActivity();
    }
  };

  // Auto cleanup check on mount
  useEffect(() => {
    if (isDemoMode && demoService.shouldAutoCleanup()) {
      console.log('[Demo] Auto cleanup triggered due to inactivity');
      demoService.cleanupDemoData();
    }
  }, [isDemoMode]);

  // Update activity on any interaction when in demo mode
  useEffect(() => {
    if (isDemoMode) {
      const updateActivity = () => demoService.updateActivity();
      
      // Track user interactions
      document.addEventListener('click', updateActivity);
      document.addEventListener('keydown', updateActivity);
      document.addEventListener('scroll', updateActivity);

      return () => {
        document.removeEventListener('click', updateActivity);
        document.removeEventListener('keydown', updateActivity);
        document.removeEventListener('scroll', updateActivity);
      };
    }
  }, [isDemoMode]);

  return {
    trackOperation,
    getDemoStats: () => demoService.getDemoStats(),
    getOperationsForTable: (table: string) => demoService.getOperationsForTable(table),
    triggerManualCleanup: () => demoService.triggerManualCleanup(),
    isDemoMode
  };
};