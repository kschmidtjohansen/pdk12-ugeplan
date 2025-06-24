
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

  // COMPREHENSIVE FIX v2: Updated role-based filtering logic
  private static applyRoleBasedFilter(assignments: Assignment[], options: FilterOptions): Assignment[] {
    const { userRole, userName, includeUnpublished = false } = options;

    if (!userRole) return assignments;

    console.log(`[AssignmentFilterService] COMPREHENSIVE FIX v2 - Applying role-based filter for ${userRole} with includeUnpublished: ${includeUnpublished}`);

    switch (userRole) {
      case 'administrator':
      case 'skadeleder':
        // Admins and skadeleder can see all assignments
        const adminFiltered = assignments.filter(a => includeUnpublished || a.published);
        console.log(`[AssignmentFilterService] COMPREHENSIVE FIX v2 - Admin/Skadeleder sees ${adminFiltered.length} assignments`);
        return adminFiltered;

      case 'servicemedarbejder':
        // COMPREHENSIVE FIX v2: Servicemedarbejder sees ALL published assignments (no user filtering at this level)
        const serviceFiltered = assignments.filter(a => a.published);
        console.log(`[AssignmentFilterService] COMPREHENSIVE FIX v2 - Servicemedarbejder sees ${serviceFiltered.length} published assignments (ALL)`);
        return serviceFiltered;

      default:
        // Default: only published assignments
        const defaultFiltered = assignments.filter(a => a.published);
        console.log(`[AssignmentFilterService] COMPREHENSIVE FIX v2 - Default role sees ${defaultFiltered.length} published assignments`);
        return defaultFiltered;
    }
  }

  // COMPREHENSIVE FIX v2: Dashboard filtering - preserve ALL employee names
  static filterForDashboard(assignments: Assignment[], options: FilterOptions = {}): Assignment[] {
    const { userRole, userName } = options;

    if (!userRole) return [];

    console.log(`[AssignmentFilterService] COMPREHENSIVE FIX v2 - Dashboard filtering for ${userRole} user: ${userName}`);

    // Dashboard filtering is handled at the service level - just apply basic role filters
    return this.applyRoleBasedFilter(assignments, { ...options, includeUnpublished: false });
  }

  // COMPREHENSIVE FIX v2: Planner filtering - show ALL assignments based on role
  static filterForPlanner(assignments: Assignment[], options: FilterOptions = {}): Assignment[] {
    const { userRole, includeUnpublished = true } = options;

    if (!userRole) return [];

    console.log(`[AssignmentFilterService] COMPREHENSIVE FIX v2 - Planner filtering for ${userRole} with includeUnpublished: ${includeUnpublished}`);

    // For servicemedarbejder in planner: show ALL published assignments
    // For admin/skadeleder in planner: show all assignments (published + unpublished if requested)
    return this.applyRoleBasedFilter(assignments, { ...options, includeUnpublished });
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
