import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';

export const useViewSpecificFilters = () => {
  const { user } = useAuth();
  
  const getFilteredAssignments = (assignments: Assignment[], view: string): Assignment[] => {
    if (!assignments) return [];

    const userName = user?.user_metadata?.name || user?.email || 'Unknown User';
    
    switch (view) {
      case 'my-assignments':
        if (!user) return [];
        return assignments.filter(assignment => 
          assignment.employees?.some(emp => emp.id === user.id) ||
          assignment.responsibleUser?.id === user.id
        );
      
      case 'published':
        return assignments.filter(assignment => assignment.published);

      case 'unpublished':
        return assignments.filter(assignment => !assignment.published);

      default:
        return assignments;
    }
  };

  return { getFilteredAssignments };
};
