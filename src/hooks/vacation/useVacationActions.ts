
import { useVacationRequestActions } from './useVacationRequestActions';
import { useVacationApprovalActions } from './useVacationApprovalActions';

export const useVacationActions = (fetchVacations: () => Promise<void>) => {
  const { submitVacationRequest } = useVacationRequestActions(fetchVacations);
  const { approveVacation, rejectVacation } = useVacationApprovalActions(fetchVacations);

  return {
    submitVacationRequest,
    approveVacation,
    rejectVacation
  };
};
