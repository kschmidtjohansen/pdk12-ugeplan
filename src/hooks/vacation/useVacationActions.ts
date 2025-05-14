
import { useVacationRequestActions } from './useVacationRequestActions';
import { useVacationApproval } from './useVacationApproval';
import { useVacationEditing } from './useVacationEditing';
import { useVacationDeletion } from './useVacationDeletion';

export const useVacationActions = (fetchVacations: () => Promise<void>) => {
  const { submitVacationRequest } = useVacationRequestActions(fetchVacations);
  const { approveVacation, rejectVacation } = useVacationApproval(fetchVacations);
  const { editVacation } = useVacationEditing(fetchVacations);
  const { deleteVacation } = useVacationDeletion(fetchVacations);

  return {
    submitVacationRequest,
    approveVacation,
    rejectVacation,
    editVacation,
    deleteVacation
  };
};
