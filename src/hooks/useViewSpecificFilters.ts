
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

export const useViewSpecificFilters = () => {
  const { user } = useAuth();

  // Filter assignments for the planner view
  const filterForPlanner = (assignments: Assignment[], includeUnpublished = false) => {
    console.log('[useViewSpecificFilters] === PLANNER FILTER DEBUGGING ===');
    console.log('[useViewSpecificFilters] User role:', user?.role);
    console.log('[useViewSpecificFilters] User name:', user?.name);
    console.log('[useViewSpecificFilters] Include unpublished:', includeUnpublished);
    console.log('[useViewSpecificFilters] Total assignments received:', assignments.length);
    
    assignments.forEach((assignment, index) => {
      console.log(`[useViewSpecificFilters] Input Assignment ${index + 1}: ${assignment.location}`);
      console.log(`  - Employees: [${assignment.employees?.join(', ') || 'none'}]`);
      console.log(`  - Published: ${assignment.published}`);
      console.log(`  - Employee count: ${assignment.employees?.length || 0}`);
      
      // Special debugging for Fyn assignment
      if (assignment.location === 'Fyn') {
        console.log(`[useViewSpecificFilters] 🔍 FYN - Input to planner filter:`, {
          location: assignment.location,
          employees: assignment.employees,
          employeeCount: assignment.employees?.length || 0,
          published: assignment.published,
          userRole: user?.role
        });
      }
    });
    
    if (!user) {
      console.log('[useViewSpecificFilters] No user, returning empty array');
      return [];
    }

    const filtered = assignments.filter(assignment => {
      // Ensure employees is always an array before processing
      const employeeArray = Array.isArray(assignment.employees) ? assignment.employees : [];
      const safeAssignment = { ...assignment, employees: employeeArray };
      
      // For servicemedarbejdere, show ALL published assignments with ALL employee names
      // They should see all published tasks in the planner with complete team information
      if (user.role === 'servicemedarbejder') {
        const shouldShow = safeAssignment.published;
        console.log(`[useViewSpecificFilters] Servicemedarbejder filter - Assignment ${safeAssignment.id} (${safeAssignment.location}):`);
        console.log(`  - Published: ${safeAssignment.published}`);
        console.log(`  - Employees: [${safeAssignment.employees.join(', ')}]`);
        console.log(`  - Employee count: ${safeAssignment.employees.length}`);
        console.log(`  - Will be shown: ${shouldShow}`);
        
        // Special debugging for Fyn assignment
        if (assignment.location === 'Fyn') {
          console.log(`[useViewSpecificFilters] 🔍 FYN - Servicemedarbejder filter:`, {
            published: safeAssignment.published,
            employees: safeAssignment.employees,
            employeeCount: safeAssignment.employees.length,
            shouldShow: shouldShow,
            reason: shouldShow ? 'Published' : 'Not published'
          });
        }
        
        // Show ALL published assignments - servicemedarbejdere can see all published tasks in planner
        // IMPORTANT: We do NOT filter out employee names here - they should see all team members
        return shouldShow;
      }
      
      // For skadeleder and administrator, show based on includeUnpublished flag
      if (user.role === 'skadeleder' || user.role === 'administrator') {
        const shouldShow = includeUnpublished || safeAssignment.published;
        console.log(`[useViewSpecificFilters] Admin/Skadeleder - Assignment ${safeAssignment.id} (${safeAssignment.location}):`);
        console.log(`  - Published: ${safeAssignment.published}`);
        console.log(`  - Include unpublished: ${includeUnpublished}`);
        console.log(`  - Should show: ${shouldShow}`);
        console.log(`  - Employees: [${safeAssignment.employees.join(', ')}]`);
        return shouldShow;
      }
      
      // Default: only show published assignments
      console.log(`[useViewSpecificFilters] Default - Assignment ${safeAssignment.id} (${safeAssignment.location}) - Published: ${safeAssignment.published}`);
      return safeAssignment.published;
    });
    
    console.log('[useViewSpecificFilters] === FILTER RESULTS ===');
    console.log('[useViewSpecificFilters] Filtered assignments count:', filtered.length);
    filtered.forEach((assignment, index) => {
      console.log(`[useViewSpecificFilters] Output Assignment ${index + 1}: ${assignment.location}`);
      console.log(`  - Employees: [${assignment.employees?.join(', ') || 'none'}]`);
      console.log(`  - Published: ${assignment.published}`);
      console.log(`  - Employee count: ${assignment.employees?.length || 0}`);
      
      // Special debugging for Fyn assignment
      if (assignment.location === 'Fyn') {
        console.log(`[useViewSpecificFilters] 🔍 FYN - Output from planner filter:`, {
          location: assignment.location,
          employees: assignment.employees,
          employeeCount: assignment.employees?.length || 0,
          published: assignment.published,
          passedFilter: true
        });
      }
    });
    
    // IMPORTANT: Return assignments with ALL original employee data intact
    // Do NOT modify the employees array - servicemedarbejdere should see all team member names
    return filtered;
  };

  // Filter assignments for the dashboard view - servicemedarbejdere see their assignments WITH ALL team member names
  const filterForDashboard = (assignments: Assignment[]) => {
    console.log('[useViewSpecificFilters] filterForDashboard - User role:', user?.role);
    console.log('[useViewSpecificFilters] filterForDashboard - User name:', user?.name);
    console.log('[useViewSpecificFilters] filterForDashboard - Total assignments:', assignments.length);
    
    // Special debugging for Fyn assignment in dashboard filter
    const fynAssignment = assignments.find(a => a.location === 'Fyn');
    if (fynAssignment) {
      console.log(`[useViewSpecificFilters] 🔍 FYN - Dashboard filter input:`, {
        location: fynAssignment.location,
        employees: fynAssignment.employees,
        employeeCount: fynAssignment.employees?.length || 0,
        published: fynAssignment.published,
        userRole: user?.role,
        userName: user?.name
      });
    }
    
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
        
        // Special debugging for Fyn assignment in dashboard filter
        if (assignment.location === 'Fyn') {
          console.log(`[useViewSpecificFilters] 🔍 FYN - Dashboard filter result:`, {
            published: assignment.published,
            employees: employeeArray,
            employeeCount: employeeArray.length,
            userIncluded: employeeArray.includes(user.name),
            userName: user.name,
            isAssigned: isAssigned,
            reason: !isAssigned ? (
              !assignment.published ? 'Not published' :
              employeeArray.length === 0 ? 'No employees' :
              !employeeArray.includes(user.name) ? 'User not assigned' : 'Unknown'
            ) : 'User assigned'
          });
        }
        
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
