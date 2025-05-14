
import { useVacationCore } from './vacation/useVacationCore';

/**
 * Main hook for vacation functionality
 * This is a facade over the more specific vacation hooks
 */
export const useVacations = () => {
  const vacationCore = useVacationCore();
  
  return {
    ...vacationCore
  };
};
