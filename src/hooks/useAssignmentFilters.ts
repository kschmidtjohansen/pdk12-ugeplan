
import { useMemo } from 'react';
import { Assignment } from '@/types/assignment';
import { useAuth } from '@/context/AuthContext';

export const useAssignmentFilters = () => {
  const { user } = useAuth();

  // Filter assignments based on user permissions
  const filterByPermissions = (assignments: Assignment[], showUnpublished: boolean = true) => {
    return assignments.filter(assignment => {
      // Administrators and skadeledere can see all assignments
      if (user?.role === 'administrator' || user?.role === 'skadeleder') {
        return showUnpublished || assignment.published;
      }
      
      // Servicemedarbejdere can see ALL published assignments with ALL employee names
      if (user?.role === 'servicemedarbejder') {
        return assignment.published === true;
      }
      
      return false;
    });
  };

  // ENHANCED: Dashboard-specific filter - servicemedarbejdere only see their own assignments BUT WITH ALL team member names visible
  const filterForDashboard = (assignments: Assignment[], showUnpublished: boolean = false) => {
    console.log('[useAssignmentFilters] filterForDashboard called with:', {
      userRole: user?.role,
      userName: user?.name,
      totalAssignments: assignments.length,
      showUnpublished
    });
    
    return assignments.filter(assignment => {
      // Administrators and skadeledere can see all assignments
      if (user?.role === 'administrator' || user?.role === 'skadeleder') {
        const shouldShow = showUnpublished || assignment.published;
        console.log(`[useAssignmentFilters] Admin/Skadeleder - Assignment ${assignment.id} (${assignment.location}) - Should show: ${shouldShow}`);
        return shouldShow;
      }
      
      // Servicemedarbejdere can only see published assignments assigned to them
      // BUT they will see ALL team member names on those assignments (not filtered out)
      if (user?.role === 'servicemedarbejder') {
        const isAssigned = assignment.published === true && 
                          assignment.employees && 
                          assignment.employees.some(employeeName => employeeName === user?.name);
        
        console.log(`[useAssignmentFilters] Servicemedarbejder - Assignment ${assignment.id} (${assignment.location}):`, {
          published: assignment.published,
          employees: assignment.employees,
          userAssigned: isAssigned,
          allEmployeesWillBeVisible: assignment.employees
        });
        
        return isAssigned;
      }
      
      return false;
    });
  };

  // Filter assignments by date range
  const filterByDateRange = (assignments: Assignment[], startDate: string, endDate: string) => {
    return assignments.filter(assignment => {
      const assignmentDate = assignment.date;
      return assignmentDate >= startDate && assignmentDate <= endDate;
    });
  };

  // Filter assignments by week
  const filterByWeek = (assignments: Assignment[], weekNumber: number, year: number) => {
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentYear = assignmentDate.getFullYear();
      const assignmentWeek = getWeekNumber(assignmentDate);
      
      return assignmentYear === year && assignmentWeek === weekNumber;
    });
  };

  // Group assignments by date
  const groupByDate = (assignments: Assignment[]) => {
    return assignments.reduce((groups: Record<string, Assignment[]>, assignment) => {
      const date = assignment.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(assignment);
      return groups;
    }, {});
  };

  // Helper function to get week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  return {
    filterByPermissions,
    filterForDashboard,
    filterByDateRange,
    filterByWeek,
    groupByDate
  };
};
