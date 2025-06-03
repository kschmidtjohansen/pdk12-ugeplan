
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

export const useViewSpecificFilters = () => {
  const { user } = useAuth();

  // Filter assignments for the planner view
  const filterForPlanner = (assignments: Assignment[], includeUnpublished = false) => {
    console.log(`[useViewSpecificFilters] ===== PLANNER FILTER START =====`);
    console.log(`[useViewSpecificFilters] User: ${user?.name} (${user?.role})`);
    console.log(`[useViewSpecificFilters] Include unpublished: ${includeUnpublished}`);
    console.log(`[useViewSpecificFilters] Input assignments: ${assignments.length}`);
    
    // Log detailed input data
    assignments.forEach(assignment => {
      console.log(`[useViewSpecificFilters] Input assignment ${assignment.id} (${assignment.location}):`, {
        published: assignment.published,
        employees: assignment.employees,
        employeeCount: assignment.employees?.length || 0
      });
    });
    
    if (!user) {
      console.log('[useViewSpecificFilters] No user, returning empty array');
      return [];
    }

    const filtered = assignments.filter(assignment => {
      // For servicemedarbejdere, show ALL published assignments (they can see everyone's assignments with ALL names)
      // AND their own unpublished assignments
      if (user.role === 'servicemedarbejder') {
        const isAssignedToUser = assignment.employees && assignment.employees.includes(user.name);
        const shouldShow = assignment.published || (isAssignedToUser && !assignment.published);
        
        console.log(`[useViewSpecificFilters] Servicemedarbejder filter - Assignment ${assignment.id} (${assignment.location}):`, {
          published: assignment.published,
          userAssigned: isAssignedToUser,
          allEmployees: assignment.employees,
          shouldShow: shouldShow,
          reasoning: assignment.published ? 'Published assignment - show with all names' : 
                    (isAssignedToUser ? 'User assigned to unpublished' : 'Not shown')
        });
        
        return shouldShow;
      }
      
      // For skadeleder and administrator, show based on includeUnpublished flag
      if (user.role === 'skadeleder' || user.role === 'administrator') {
        const shouldShow = includeUnpublished || assignment.published;
        console.log(`[useViewSpecificFilters] Admin/Skadeleder filter - Assignment ${assignment.id} (${assignment.location}):`, {
          published: assignment.published,
          includeUnpublished: includeUnpublished,
          shouldShow: shouldShow
        });
        return shouldShow;
      }
      
      // Default: only show published assignments
      console.log(`[useViewSpecificFilters] Default filter - Assignment ${assignment.id} (${assignment.location}):`, {
        published: assignment.published,
        shouldShow: assignment.published
      });
      return assignment.published;
    });
    
    console.log(`[useViewSpecificFilters] ===== PLANNER FILTER RESULT =====`);
    console.log(`[useViewSpecificFilters] Filtered assignments: ${filtered.length}`);
    filtered.forEach(assignment => {
      console.log(`[useViewSpecificFilters] Output assignment ${assignment.id} (${assignment.location}):`, {
        employees: assignment.employees,
        employeeCount: assignment.employees?.length || 0,
        published: assignment.published
      });
    });
    
    return filtered;
  };

  // CRITICAL: Filter assignments for the dashboard view - servicemedarbejdere see their assignments WITH ALL team member names
  const filterForDashboard = (assignments: Assignment[]) => {
    console.log(`[useViewSpecificFilters] ===== DASHBOARD FILTER START =====`);
    console.log(`[useViewSpecificFilters] User: ${user?.name} (${user?.role})`);
    console.log(`[useViewSpecificFilters] Input assignments: ${assignments.length}`);
    
    // Log detailed input data for dashboard
    assignments.forEach(assignment => {
      console.log(`[useViewSpecificFilters] Dashboard input ${assignment.id} (${assignment.location}):`, {
        published: assignment.published,
        employees: assignment.employees,
        employeeCount: assignment.employees?.length || 0,
        userIncluded: assignment.employees?.includes(user?.name || '') || false
      });
    });
    
    if (!user) {
      console.log('[useViewSpecificFilters] No user, returning empty array');
      return [];
    }

    // For dashboard, servicemedarbejdere should see their own assignments but WITH ALL team member names visible
    if (user.role === 'servicemedarbejder') {
      const filtered = assignments.filter(assignment => {
        const isPublished = assignment.published === true;
        const isUserAssigned = assignment.employees && assignment.employees.includes(user.name);
        const shouldShow = isPublished && isUserAssigned;
        
        console.log(`[useViewSpecificFilters] Dashboard servicemedarbejder filter - Assignment ${assignment.id} (${assignment.location}):`, {
          published: isPublished,
          userAssigned: isUserAssigned,
          userName: user.name,
          allEmployees: assignment.employees,
          shouldShow: shouldShow,
          willShowAllNames: shouldShow ? assignment.employees : null // CRITICAL: All names should be visible
        });
        
        return shouldShow;
      });
      
      console.log(`[useViewSpecificFilters] ===== DASHBOARD SERVICEMEDARBEJDER RESULT =====`);
      console.log(`[useViewSpecificFilters] Filtered assignments for ${user.name}: ${filtered.length}`);
      filtered.forEach(assignment => {
        console.log(`[useViewSpecificFilters] Dashboard output ${assignment.id} (${assignment.location}):`, {
          employees: assignment.employees, // Should show ALL names like "Mark Hansen, Lars Hoeg"
          employeeCount: assignment.employees?.length || 0
        });
      });
      
      return filtered;
    }
    
    // For skadeleder and administrator, show all published assignments
    const filtered = assignments.filter(assignment => {
      const shouldShow = assignment.published;
      console.log(`[useViewSpecificFilters] Dashboard admin filter - Assignment ${assignment.id} (${assignment.location}):`, {
        published: assignment.published,
        shouldShow: shouldShow
      });
      return shouldShow;
    });
    
    console.log(`[useViewSpecificFilters] ===== DASHBOARD ADMIN RESULT =====`);
    console.log(`[useViewSpecificFilters] Admin/Skadeleder filtered assignments: ${filtered.length}`);
    
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
