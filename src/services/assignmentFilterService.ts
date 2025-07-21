
import { Assignment, normalizeEmployees } from '@/types/assignment';
import { getISOWeek, getISOWeekYear } from 'date-fns';

export type AssignmentFilter = 'all' | 'user' | 'published' | 'unpublished';

export class AssignmentFilterService {
  static filterAssignments(assignments: Assignment[], filter: AssignmentFilter, userId?: string): Assignment[] {
    switch (filter) {
      case 'user':
        return assignments.filter(assignment => {
          const normalizedEmployees = normalizeEmployees(assignment.employees);
          return normalizedEmployees.includes(userId || '') ||
            assignment.responsibleUserId === userId;
        });
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

  static filterByWeek(assignments: Assignment[], weekNumber: number, year: number): Assignment[] {
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentWeek = getISOWeek(assignmentDate);
      const assignmentYear = getISOWeekYear(assignmentDate);
      return assignmentWeek === weekNumber && assignmentYear === year;
    });
  }

  static filterByDateRange(assignments: Assignment[], startDate: string, endDate: string): Assignment[] {
    return assignments.filter(assignment => {
      const assignmentDate = assignment.date;
      return assignmentDate >= startDate && assignmentDate <= endDate;
    });
  }

  static filterForDashboard(assignments: Assignment[], options: { userRole?: string; userName?: string }): Assignment[] {
    // For dashboard, show user's assignments and published assignments
    if (options.userRole === 'servicemedarbejder') {
      return assignments.filter(assignment => {
        if (!assignment.published) return false;
        const normalizedEmployees = normalizeEmployees(assignment.employees);
        return normalizedEmployees.includes(options.userName || '') ||
          assignment.responsibleUserId;
      });
    }
    return assignments.filter(assignment => assignment.published);
  }

  static filterForPlanner(assignments: Assignment[], options: { userRole?: string; includeUnpublished?: boolean }): Assignment[] {
    // For planner, admin/skadeleder can see all, servicemedarbejder only published
    if (options.userRole === 'servicemedarbejder') {
      return assignments.filter(assignment => assignment.published);
    }
    return assignments; // Admin/skadeleder see all
  }
}
