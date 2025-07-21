
// Migration utility to help transition from Phase 2 to Phase 3
import { useAssignmentDataOptimized } from '@/hooks/assignment/useAssignmentDataOptimized';
import { useAssignmentDataPhase3 } from '@/hooks/assignment/useAssignmentDataPhase3';

export const useAssignmentDataMigration = () => {
  // Feature flag for gradual migration
  const USE_PHASE_3 = localStorage.getItem('assignment_data_phase3_enabled') === 'true';
  
  if (USE_PHASE_3) {
    console.log('[Migration] Using Phase 3 optimized assignment data hook');
    return useAssignmentDataPhase3();
  } else {
    console.log('[Migration] Using Phase 2 optimized assignment data hook');
    return useAssignmentDataOptimized();
  }
};

// Migration helper functions
export const enablePhase3 = () => {
  localStorage.setItem('assignment_data_phase3_enabled', 'true');
  window.location.reload(); // Reload to apply changes
};

export const disablePhase3 = () => {
  localStorage.setItem('assignment_data_phase3_enabled', 'false');
  window.location.reload(); // Reload to apply changes
};

export const isPhase3Enabled = () => {
  return localStorage.getItem('assignment_data_phase3_enabled') === 'true';
};
