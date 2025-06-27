
import { Assignment } from '@/types/assignment';

export type AssignmentFilter = 'all' | 'user' | 'published' | 'unpublished';

export class AssignmentFilterService {
  static filterAssignments(assignments: Assignment[], filter: AssignmentFilter, userId?: string): Assignment[] {
    switch (filter) {
      case 'user':
        return assignments.filter(assignment => 
          assignment.employees?.includes(userId || '') ||
          assignment.responsibleUserId === userId
        );
      case 'published':
        return assignments.filter(assignment => assignment.published);
      case 'unpublished':
        return assignments.filter(assignment => !assignment.published);
      case 'all':
      default:
        return assignments;
    }
  }

  static sortByDate(assignments: Assignment[]): Assignment[] {
    return [...assignments].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }

  static groupByDate(assignments: Assignment[]): Record<string, Assignment[]> {
    return assignments.reduce((groups, assignment) => {
      const date = assignment.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(assignment);
      return groups;
    }, {} as Record<string, Assignment[]>);
  }
}
