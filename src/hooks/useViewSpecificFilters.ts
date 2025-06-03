
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

export const useViewSpecificFilters = () => {
  const { user } = useAuth();

  // Filter assignments for the planner view - now optimized with improved RLS policies
  const filterForPlanner = (assignments: Assignment[], includeUnpublished = false) => {
    console.log('[useViewSpecificFilters] === PLANNER FILTER DEBUGGING ===');
    console.log('[useViewSpecificFilters] User role:', user?.role);
    console.log('[useViewSpecificFilters] User name:', user?.name);
    console.log('[useViewSpecificFilters] Include unpublished:', includeUnpublished);
    console.log('[useViewSpecificFilters] Total assignments received:', assignments.length);
    
    if (!user) {
      console.log('[useViewSpecificFilters] No user, returning empty array');
      return [];
    }

    // With the new RLS policies, we can simplify the filtering logic
    // The database now handles most of the access control through standardized policies
    const filtered = assignments.filter(assignment => {
      // Ensure employees is always an array before processing
      const employeeArray = Array.isArray(assignment.employees) ? assignment.employees : [];
      const safeAssignment = { ...assignment, employees: employeeArray };
      
      // For servicemedarbejdere, show ALL published assignments with ALL employee names
      if (user.role === 'servicemedarbejder') {
        const shouldShow = safeAssignment.published;
        console.log(`[useViewSpecificFilters] Servicemedarbejder filter - Assignment ${safeAssignment.id} (${safeAssignment.location}): Published: ${safeAssignment.published}, Will be shown: ${shouldShow}`);
        return shouldShow;
      }
      
      // For skadeleder and administrator, show based on includeUnpublished flag
      if (user.role === 'skadeleder' || user.role === 'administrator') {
        const shouldShow = includeUnpublished || safeAssignment.published;
        console.log(`[useViewSpecificFilters] Admin/Skadeleder - Assignment ${safeAssignment.id}: Published: ${safeAssignment.published}, Should show: ${shouldShow}`);
        return shouldShow;
      }
      
      // Default: only show published assignments
      return safeAssignment.published;
    });
    
    console.log('[useViewSpecificFilters] Filtered assignments count:', filtered.length);
    // Return assignments with ALL original employee data intact
    return filtered;
  };

  // Filter assignments for the dashboard view - optimized with new RLS policies
  const filterForDashboard = (assignments: Assignment[]) => {
    console.log('[useViewSpecificFilters] filterForDashboard - User role:', user?.role);
    console.log('[useViewSpecificFilters] filterForDashboard - Total assignments:', assignments.length);
    
    if (!user) return [];

    // For dashboard, servicemedarbejdere should see their own assignments but WITH ALL team member names visible
    if (user.role === 'servicemedarbejder') {
      const filtered = assignments.filter(assignment => {
        const employeeArray = Array.isArray(assignment.employees) ? assignment.employees : [];
        const isAssigned = assignment.published && 
                          employeeArray.length > 0 && 
                          employeeArray.includes(user.name);
        return isAssigned;
      });
      
      console.log('[useViewSpecificFilters] filterForDashboard - Servicemedarbejder filtered assignments:', filtered.length);
      return filtered;
    }
    
    // For skadeleder and administrator, show all published assignments
    const filtered = assignments.filter(assignment => assignment.published);
    
    console.log('[useViewSpecificFilters] filterForDashboard - Admin/Skadeleder filtered assignments:', filtered.length);
    return filtered;
  };

  // Filter assignments for the screen display
  const filterForScreenDisplay = (assignments: Assignment[]) => {
    // Screen display should only show published assignments for all users
    return assignments.filter(assignment => assignment.published);
  };

  return {
    filterForPlanner,
    filterForDashboard,
    filterForScreenDisplay
  };
};
