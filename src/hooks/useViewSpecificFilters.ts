
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

export const useViewSpecificFilters = () => {
  const { user } = useAuth();

  // Filter for dashboard - servicemedarbejdere only see their own assignments
  const filterForDashboard = (assignments: Assignment[], showUnpublished: boolean = false) => {
    console.log("[useViewSpecificFilters] Dashboard filter - User:", user?.name, "Role:", user?.role);
    console.log("[useViewSpecificFilters] Dashboard filter - Total assignments:", assignments.length);
    
    const filtered = assignments.filter(assignment => {
      // Administrators and skadeledere can see all assignments
      if (user?.role === 'administrator' || user?.role === 'skadeleder') {
        const isVisible = showUnpublished || assignment.published;
        console.log(`[Dashboard] Admin/Skadeleder - Assignment ${assignment.id}: published=${assignment.published}, visible=${isVisible}`);
        return isVisible;
      }
      
      // Servicemedarbejdere can only see published assignments assigned to them
      if (user?.role === 'servicemedarbejder') {
        const isPublished = assignment.published === true;
        const isAssigned = assignment.employees && assignment.employees.some(employeeName => employeeName === user?.name);
        const isVisible = isPublished && isAssigned;
        console.log(`[Dashboard] Servicemedarbejder - Assignment ${assignment.id}: published=${isPublished}, assigned=${isAssigned}, visible=${isVisible}`);
        console.log(`[Dashboard] Assignment employees:`, assignment.employees);
        return isVisible;
      }
      
      return false;
    });
    
    console.log("[useViewSpecificFilters] Dashboard filtered assignments:", filtered.length);
    return filtered;
  };

  // Filter for planner - servicemedarbejdere can see ALL published assignments (not just their own)
  const filterForPlanner = (assignments: Assignment[], showUnpublished: boolean = true) => {
    console.log("[useViewSpecificFilters] Planner filter - User:", user?.name, "Role:", user?.role);
    console.log("[useViewSpecificFilters] Planner filter - Total assignments:", assignments.length);
    console.log("[useViewSpecificFilters] Planner filter - Show unpublished:", showUnpublished);
    
    const filtered = assignments.filter(assignment => {
      // Administrators and skadeledere can see all assignments (published and unpublished)
      if (user?.role === 'administrator' || user?.role === 'skadeleder') {
        const isVisible = showUnpublished || assignment.published;
        console.log(`[Planner] Admin/Skadeleder - Assignment ${assignment.id}: published=${assignment.published}, visible=${isVisible}`);
        return isVisible;
      }
      
      // Servicemedarbejdere can see ALL published assignments (this allows them to see all employee names and assignments)
      if (user?.role === 'servicemedarbejder') {
        const isVisible = assignment.published === true;
        console.log(`[Planner] Servicemedarbejder - Assignment ${assignment.id}: published=${assignment.published}, visible=${isVisible}`);
        if (isVisible && assignment.employees) {
          console.log(`[Planner] Assignment employees:`, assignment.employees);
        }
        return isVisible;
      }
      
      return false;
    });
    
    console.log("[useViewSpecificFilters] Planner filtered assignments:", filtered.length);
    return filtered;
  };

  return {
    filterForDashboard,
    filterForPlanner
  };
};
