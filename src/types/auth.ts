
// Re-export types from auth module
export type { User, UserRole, AuthContextType, AuthProviderProps } from '../auth/types';

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
