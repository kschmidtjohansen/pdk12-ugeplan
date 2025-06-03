
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
    console.log('[useViewSpecificFilters] filterForPlanner - Raw assignments data:', assignments.map(a => ({
      id: a.id,
      location: a.location,
      published: a.published,
      employees: a.employees,
      employeeCount: a.employees?.length || 0
    })));
    
    if (!user) {
      console.log('[useViewSpecificFilters] filterForPlanner - No user, returning empty array');
      return [];
    }

    const filtered = assignments.filter(assignment => {
      // Ensure employees is always an array before processing
      const employeeArray = Array.isArray(assignment.employees) ? assignment.employees : [];
      const safeAssignment = { ...assignment, employees: employeeArray };
      
      // For servicemedarbejdere, show ALL published assignments with ALL employee names
      // They should see all published tasks in the planner with complete team information
      if (user.role === 'servicemedarbejder') {
        console.log(`[useViewSpecificFilters] Servicemedarbejder filter - Assignment ${safeAssignment.id} (${safeAssignment.location}):`, {
          published: safeAssignment.published,
          employees: safeAssignment.employees,
          employeeCount: safeAssignment.employees.length,
          willBeShown: safeAssignment.published
        });
        
        // Show ALL published assignments - servicemedarbejdere can see all published tasks in planner
        // IMPORTANT: We do NOT filter out employee names here - they should see all team members
        return safeAssignment.published;
      }
      
      // For skadeleder and administrator, show based on includeUnpublished flag
      if (user.role === 'skadeleder' || user.role === 'administrator') {
        const shouldShow = includeUnpublished || safeAssignment.published;
        console.log(`[useViewSpecificFilters] Admin/Skadeleder - Assignment ${safeAssignment.id} (${safeAssignment.location}) - Should show: ${shouldShow}`);
        return shouldShow;
      }
      
      // Default: only show published assignments
      console.log(`[useViewSpecificFilters] Default - Assignment ${safeAssignment.id} (${safeAssignment.location}) - Published: ${safeAssignment.published}`);
      return safeAssignment.published;
    });
    
    console.log('[useViewSpecificFilters] filterForPlanner - Filtered assignments:', filtered.length);
    console.log('[useViewSpecificFilters] filterForPlanner - Filtered assignment details:', filtered.map(a => ({
      id: a.id,
      location: a.location,
      published: a.published,
      employees: a.employees,
      employeeCount: a.employees?.length || 0
    })));
    
    // IMPORTANT: Return assignments with ALL original employee data intact
    // Do NOT modify the employees array - servicemedarbejdere should see all team member names
    return filtered;
  };

  // Filter assignments for the dashboard view - servicemedarbejdere see their assignments WITH ALL team member names
  const filterForDashboard = (assignments: Assignment[]) => {
    console.log('[useViewSpecificFilters] filterForDashboard - User role:', user?.role);
    console.log('[useViewSpecificFilters] filterForDashboard - User name:', user?.name);
    console.log('[useViewSpecificFilters] filterForDashboard - Total assignments:', assignments.length);
    
    if (!user) return [];

    // For dashboard, servicemedarbejdere should see their own assignments but WITH ALL team member names visible
    if (user.role === 'servicemedarbejder') {
      const filtered = assignments.filter(assignment => {
        // Ensure employees is always an array
        const employeeArray = Array.isArray(assignment.employees) ? assignment.employees : [];
        
        const isAssigned = assignment.published && 
                          employeeArray.length > 0 && 
                          employeeArray.includes(user.name);
        
        console.log(`[useViewSpecificFilters] Dashboard filter - Assignment ${assignment.id} (${assignment.location}):`, {
          published: assignment.published,
          employees: employeeArray,
          userAssigned: isAssigned,
          allEmployeesWillBeShown: employeeArray
        });
        
        return isAssigned;
      });
      
      console.log('[useViewSpecificFilters] filterForDashboard - Servicemedarbejder filtered assignments:', filtered.length);
      // IMPORTANT: Return assignments with ALL original employee data intact
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
