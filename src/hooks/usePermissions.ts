
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth";

// Hook to check permissions based on role
export const usePermissions = () => {
  const { user } = useAuth();
  
  return {
    // General permissions
    canCreate: user?.role === "administrator" || user?.role === "skadeleder",
    canEdit: user?.role === "administrator" || user?.role === "skadeleder",
    canDelete: user?.role === "administrator",
    canViewFuelCardCode: user?.role === "administrator",
    isAdmin: user?.role === "administrator",
    isSkadeleder: user?.role === "skadeleder",
    isServicemedarbejder: user?.role === "servicemedarbejder",
    
    // Vacation specific permissions
    canApproveVacation: user?.role === "administrator",
    canViewAllVacations: user?.role === "administrator" || user?.role === "skadeleder",
    
    // Task visibility
    canSeeUnpublishedTasks: user?.role === "administrator" || user?.role === "skadeleder",
    canPublishTasks: user?.role === "administrator" || user?.role === "skadeleder",
    
    // Helper function to check if user has a specific role or higher
    hasRole: (minimumRole: UserRole): boolean => {
      if (!user) return false;
      
      if (minimumRole === "servicemedarbejder") return true; // Everyone is at least servicemedarbejder
      if (minimumRole === "skadeleder") return user.role === "skadeleder" || user.role === "administrator";
      if (minimumRole === "administrator") return user.role === "administrator";
      
      return false;
    }
  };
};
