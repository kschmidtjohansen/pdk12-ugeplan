
import { useVacationApprovalActions } from './useVacationApprovalActions';

/**
 * Hook for managing vacation approval and rejection actions
 * This is a facade over the more specific vacation action hooks
 */
export const useVacationActions = (fetchVacations: () => Promise<void>) => {
  const { approveVacation, rejectVacation } = useVacationApprovalActions(fetchVacations);

  return {
    approveVacation,
    rejectVacation
  };
};
