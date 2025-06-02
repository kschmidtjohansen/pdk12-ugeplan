
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
      // For servicemedarbejdere, show ALL published assignments (they can see everyone's assignments with ALL names)
      // AND their own unpublished assignments
      if (user.role === 'servicemedarbejder') {
        const isAssignedToUser = assignment.employees && assignment.employees.includes(user.name);
        console.log(`[useViewSpecificFilters] Assignment ${assignment.id} (${assignment.location}) - Published: ${assignment.published}, User ${user.name} assigned: ${isAssignedToUser}, Employees: [${assignment.employees?.join(', ') || 'none'}]`);
        
        // Show ALL published assignments (so they can see all published tasks with all employee names)
        // PLUS any unpublished assignments they are assigned to
        const shouldShow = assignment.published || isAssignedToUser;
        console.log(`[useViewSpecificFilters] Assignment ${assignment.id} (${assignment.location}) - Should show: ${shouldShow}`);
        
        return shouldShow;
      }
      
      // For skadeleder and administrator, show based on includeUnpublished flag
      if (user.role === 'skadeleder' || user.role === 'administrator') {
        const shouldShow = includeUnpublished || assignment.published;
        console.log(`[useViewSpecificFilters] Admin/Skadeleder - Assignment ${assignment.id} (${assignment.location}) - Should show: ${shouldShow}`);
        return shouldShow;
      }
      
      // Default: only show published assignments
      console.log(`[useViewSpecificFilters] Default - Assignment ${assignment.id} (${assignment.location}) - Published: ${assignment.published}`);
      return assignment.published;
    });
    
    console.log('[useViewSpecificFilters] filterForPlanner - Filtered assignments:', filtered.length);
    console.log('[useViewSpecificFilters] filterForPlanner - Filtered assignment details:', filtered.map(a => ({
      id: a.id,
      location: a.location,
      published: a.published,
      employees: a.employees
    })));
    return filtered;
  };

  // ENHANCED: Filter assignments for the dashboard view - servicemedarbejdere see their assignments WITH ALL team member names
  const filterForDashboard = (assignments: Assignment[]) => {
    console.log('[useViewSpecificFilters] filterForDashboard - User role:', user?.role);
    console.log('[useViewSpecificFilters] filterForDashboard - User name:', user?.name);
    console.log('[useViewSpecificFilters] filterForDashboard - Total assignments:', assignments.length);
    
    if (!user) return [];

    // For dashboard, servicemedarbejdere should see their own assignments but WITH ALL team member names visible
    if (user.role === 'servicemedarbejder') {
      const filtered = assignments.filter(assignment => {
        const isAssigned = assignment.published && 
                          assignment.employees && 
                          assignment.employees.includes(user.name);
        
        console.log(`[useViewSpecificFilters] Dashboard filter - Assignment ${assignment.id} (${assignment.location}):`, {
          published: assignment.published,
          employees: assignment.employees,
          userAssigned: isAssigned,
          allEmployeesWillBeShown: assignment.employees
        });
        
        return isAssigned;
      });
      
      console.log('[useViewSpecificFilters] filterForDashboard - Servicemedarbejder filtered assignments:', filtered.length);
      return filtered;
    }
    
    // For skadeleder and administrator, show all published assignments
    const filtered = assignments.filter(assignment => {
      console.log(`[useViewSpecificFilters] Dashboard filter - Admin/Skadeleder - Assignment ${assignment.id} (${assignment.location}) - Published: ${assignment.published}`);
      return assignment.published;
    });
    
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
