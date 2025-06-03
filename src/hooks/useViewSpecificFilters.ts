
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

export const useViewSpecificFilters = () => {
  const { user } = useAuth();

  // Filter assignments for the planner view
  const filterForPlanner = (assignments: Assignment[], includeUnpublished = false) => {
    console.log(`[useViewSpecificFilters] filterForPlanner - User: ${user?.name} (${user?.role})`);
    console.log(`[useViewSpecificFilters] filterForPlanner - Include unpublished: ${includeUnpublished}`);
    console.log(`[useViewSpecificFilters] filterForPlanner - Input assignments:`, assignments.map(a => ({
      id: a.id,
      location: a.location,
      published: a.published,
      employees: a.employees
    })));
    
    if (!user) {
      console.log('[useViewSpecificFilters] filterForPlanner - No user, returning empty array');
      return [];
    }

    const filtered = assignments.filter(assignment => {
      // For servicemedarbejdere, show ALL published assignments (they can see everyone's assignments with ALL names)
      // AND their own unpublished assignments
      if (user.role === 'servicemedarbejder') {
        const isAssignedToUser = assignment.employees && assignment.employees.includes(user.name);
        console.log(`[useViewSpecificFilters] Servicemedarbejder - Assignment ${assignment.id} (${assignment.location}):`, {
          published: assignment.published,
          userAssigned: isAssignedToUser,
          allEmployees: assignment.employees,
          shouldShow: assignment.published || (isAssignedToUser && !assignment.published)
        });
        
        // CRITICAL: Show ALL published assignments (so they can see all published tasks with all employee names)
        // PLUS any unpublished assignments they are assigned to
        return assignment.published || (isAssignedToUser && !assignment.published);
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
    
    console.log(`[useViewSpecificFilters] filterForPlanner - Output assignments:`, filtered.map(a => ({
      id: a.id,
      location: a.location,
      published: a.published,
      employees: a.employees
    })));
    
    return filtered;
  };

  // CRITICAL: Filter assignments for the dashboard view - servicemedarbejdere see their assignments WITH ALL team member names
  const filterForDashboard = (assignments: Assignment[]) => {
    console.log(`[useViewSpecificFilters] filterForDashboard - User: ${user?.name} (${user?.role})`);
    console.log(`[useViewSpecificFilters] filterForDashboard - Input assignments:`, assignments.map(a => ({
      id: a.id,
      location: a.location,
      published: a.published,
      employees: a.employees
    })));
    
    if (!user) {
      console.log('[useViewSpecificFilters] filterForDashboard - No user, returning empty array');
      return [];
    }

    // For dashboard, servicemedarbejdere should see their own assignments but WITH ALL team member names visible
    if (user.role === 'servicemedarbejder') {
      const filtered = assignments.filter(assignment => {
        const isAssigned = assignment.published && 
                          assignment.employees && 
                          assignment.employees.includes(user.name);
        
        console.log(`[useViewSpecificFilters] Dashboard filter - Servicemedarbejder - Assignment ${assignment.id} (${assignment.location}):`, {
          published: assignment.published,
          employees: assignment.employees,
          userAssigned: isAssigned,
          willShowAllEmployees: assignment.employees // CRITICAL: All names should be visible
        });
        
        return isAssigned;
      });
      
      console.log(`[useViewSpecificFilters] filterForDashboard - Servicemedarbejder output:`, filtered.map(a => ({
        id: a.id,
        location: a.location,
        employees: a.employees // Should show ALL names like "Mark Hansen, Lars Hoeg"
      })));
      
      return filtered;
    }
    
    // For skadeleder and administrator, show all published assignments
    const filtered = assignments.filter(assignment => {
      console.log(`[useViewSpecificFilters] Dashboard filter - Admin/Skadeleder - Assignment ${assignment.id} (${assignment.location}) - Published: ${assignment.published}`);
      return assignment.published;
    });
    
    console.log(`[useViewSpecificFilters] filterForDashboard - Admin/Skadeleder output:`, filtered.map(a => ({
      id: a.id,
      location: a.location,
      employees: a.employees
    })));
    
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
