import { Assignment } from '@/types/assignment';

// Filters and groups assignments
export const useAssignmentFilters = () => {
  // Filter assignments based on user permissions
  const filterByPermissions = (assignments: Assignment[], canSeeUnpublishedTasks: boolean) => {
    if (canSeeUnpublishedTasks) {
      // Admin or skadeleder can see all
      return assignments;
    } else {
      // Others can only see published tasks
      return assignments.filter(a => a.published);
    }
  };

  // Group assignments by date
  const groupByDate = (assignments: Assignment[]) => {
    const grouped: Record<string, Assignment[]> = {};
    
    assignments.forEach(assignment => {
      const date = assignment.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(assignment);
    });
    
    return grouped;
  };

  return {
    filterByPermissions,
    groupByDate
  };
};
