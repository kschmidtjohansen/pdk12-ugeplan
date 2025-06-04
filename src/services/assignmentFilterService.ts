
import { Assignment } from '@/types/assignment';

export interface FilterOptions {
  userRole?: string;
  userName?: string;
  includeUnpublished?: boolean;
  startDate?: string;
  endDate?: string;
  weekNumber?: number;
  year?: number;
}

export class AssignmentFilterService {
  // Main filter method that applies all filtering logic
  static filter(assignments: Assignment[], options: FilterOptions = {}): Assignment[] {
    if (!assignments?.length) return [];

    let filtered = [...assignments];

    // Apply role-based filtering
    filtered = this.applyRoleBasedFilter(filtered, options);

    // Apply date range filtering
    if (options.startDate && options.endDate) {
      filtered = this.filterByDateRange(filtered, options.startDate, options.endDate);
    }

    // Apply week filtering
    if (options.weekNumber && options.year) {
      filtered = this.filterByWeek(filtered, options.weekNumber, options.year);
    }

    return filtered;
  }

  // Role-based filtering logic
  private static applyRoleBasedFilter(assignments: Assignment[], options: FilterOptions): Assignment[] {
    const { userRole, userName, includeUnpublished = false } = options;

    if (!userRole) return assignments;

    switch (userRole) {
      case 'administrator':
      case 'skadeleder':
        return assignments.filter(a => includeUnpublished || a.published);

      case 'servicemedarbejder':
        return assignments.filter(a => a.published);

      default:
        return assignments.filter(a => a.published);
    }
  }

  // Dashboard-specific filtering
  static filterForDashboard(assignments: Assignment[], options: FilterOptions = {}): Assignment[] {
    const { userRole, userName } = options;

    if (!userRole) return [];

    if (userRole === 'servicemedarbejder') {
      return assignments.filter(a => 
        a.published && 
        a.employees && 
        a.employees.includes(userName || '')
      );
    }

    return assignments.filter(a => a.published);
  }

  // Planner-specific filtering
  static filterForPlanner(assignments: Assignment[], options: FilterOptions = {}): Assignment[] {
    const { userRole, includeUnpublished = true } = options;

    if (!userRole) return [];

    if (userRole === 'servicemedarbejder') {
      return assignments.filter(a => a.published);
    }

    return assignments.filter(a => includeUnpublished || a.published);
  }

  // Date range filtering
  static filterByDateRange(assignments: Assignment[], startDate: string, endDate: string): Assignment[] {
    return assignments.filter(assignment => {
      const assignmentDate = assignment.date;
      return assignmentDate >= startDate && assignmentDate <= endDate;
    });
  }

  // Week filtering
  static filterByWeek(assignments: Assignment[], weekNumber: number, year: number): Assignment[] {
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentYear = assignmentDate.getFullYear();
      const assignmentWeek = this.getWeekNumber(assignmentDate);
      
      return assignmentYear === year && assignmentWeek === weekNumber;
    });
  }

  // Group assignments by date
  static groupByDate(assignments: Assignment[]): Record<string, Assignment[]> {
    return assignments.reduce((groups: Record<string, Assignment[]>, assignment) => {
      const date = assignment.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(assignment);
      return groups;
    }, {});
  }

  // Helper function to get week number
  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
