import { useAssignmentsConsolidated } from './useAssignmentsConsolidated';

// Legacy wrapper for backward compatibility
// Note: Schema routing is handled in lower-level data fetching services
export const useAssignments = () => {
  return useAssignmentsConsolidated({ filter: 'all' });
};
