
import { UserRole } from '../auth/types';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to check user permissions based on their role
 * @returns Object with various permission flags and helper functions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  
  // Role hierarchy from lowest to highest
  const roleHierarchy: UserRole[] = ['servicemedarbejder', 'skadeleder', 'administrator'];
  
  /**
   * Check if a user has a specific role or higher in the hierarchy
   */
  const hasRole = (minimumRole: UserRole): boolean => {
    if (!user) return false;
    
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(minimumRole);
    
    return userRoleIndex >= requiredRoleIndex && userRoleIndex !== -1 && requiredRoleIndex !== -1;
  };
  
  return {
    // General permissions
    canCreate: hasRole('skadeleder'),
    canEdit: hasRole('skadeleder'),
    canDelete: hasRole('administrator'),
    canViewFuelCardCode: hasRole('administrator'),
    isAdmin: hasRole('administrator'),
    isSkadeleder: hasRole('skadeleder'),
    isServicemedarbejder: hasRole('servicemedarbejder'),
    
    // Vacation specific permissions
    canApproveVacation: hasRole('administrator'),
    canViewAllVacations: hasRole('skadeleder'),
    
    // Task visibility
    canSeeUnpublishedTasks: hasRole('skadeleder'),
    canPublishTasks: hasRole('skadeleder'),
    
    // Helper function to check if user has a specific role or higher
    hasRole
  };
};
