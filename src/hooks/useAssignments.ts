
import { useAssignmentsConsolidated } from './useAssignmentsConsolidated';

// Legacy wrapper for backward compatibility
export const useAssignments = () => {
  return useAssignmentsConsolidated({ filter: 'all' });
};
