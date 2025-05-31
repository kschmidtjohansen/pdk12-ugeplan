
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

export const useViewSpecificFilters = () => {
  const { user } = useAuth();

  // Filter assignments for the planner view
  const filterForPlanner = (assignments: Assignment[], includeUnpublished = false) => {
    console.log('[useViewSpecificFilters] filterForPlanner - User role:', user?.role);
    console.log('[useViewSpecificFilters] filterForPlanner - User name:', user?.name);
    console.log('[useViewSpecificFilters] filterForPlanner - Include unpublished:', includeUnpublished);
    console.log('[useViewSpecificFilters] filterForPlanner - Total assignments:', assignments.length);
    
    if (!user) {
      console.log('[useViewSpecificFilters] filterForPlanner - No user, returning empty array');
      return [];
    }

    const filtered = assignments.filter(assignment => {
      // For servicemedarbejdere, show ALL published assignments OR assignments they are assigned to (even if unpublished)
      if (user.role === 'servicemedarbejder') {
        const isAssignedToUser = assignment.employees && assignment.employees.includes(user.name);
        console.log(`[useViewSpecificFilters] Assignment ${assignment.id} - Published: ${assignment.published}, User ${user.name} assigned: ${isAssignedToUser}`);
        
        // FIXED: Show ALL published assignments (not just those assigned to them) + their own unpublished assignments
        const shouldShow = assignment.published || isAssignedToUser;
        console.log(`[useViewSpecificFilters] Assignment ${assignment.id} - Should show: ${shouldShow}`);
        
        return shouldShow;
      }
      
      // For skadeleder and administrator, show based on includeUnpublished flag
      if (user.role === 'skadeleder' || user.role === 'administrator') {
        return includeUnpublished || assignment.published;
      }
      
      // Default: only show published assignments
      return assignment.published;
    });
    
    console.log('[useViewSpecificFilters] filterForPlanner - Filtered assignments:', filtered.length);
    console.log('[useViewSpecificFilters] filterForPlanner - Filtered assignment details:', filtered.map(a => ({
      id: a.id,
      title: a.title,
      published: a.published,
      employees: a.employees
    })));
    return filtered;
  };

  // Filter assignments for the dashboard view
  const filterForDashboard = (assignments: Assignment[]) => {
    console.log('[useViewSpecificFilters] filterForDashboard - User role:', user?.role);
    
    if (!user) return [];

    // For dashboard, servicemedarbejdere should only see their own published assignments
    if (user.role === 'servicemedarbejder') {
      return assignments.filter(assignment => 
        assignment.published && 
        assignment.employees && 
        assignment.employees.includes(user.name)
      );
    }
    
    // For skadeleder and administrator, show all published assignments
    return assignments.filter(assignment => assignment.published);
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
