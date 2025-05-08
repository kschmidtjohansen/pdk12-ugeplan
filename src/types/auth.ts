
import { UserRole } from '../auth/types';

// Re-export types from auth module
export type { User, AuthContextType, AuthProviderProps } from '../auth/types';
export type { UserRole };

// Permission interface
export interface Permissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewFuelCardCode: boolean;
  isAdmin: boolean;
  isSkadeleder: boolean;
  isServicemedarbejder: boolean;
  canApproveVacation: boolean;
  canViewAllVacations: boolean;
  canSeeUnpublishedTasks: boolean;
  canPublishTasks: boolean;
  hasRole: (minimumRole: UserRole) => boolean;
}
