
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

  // FIXED: CRITICAL FIX - Role-based filtering logic updated for proper visibility
  private static applyRoleBasedFilter(assignments: Assignment[], options: FilterOptions): Assignment[] {
    const { userRole, userName, includeUnpublished = false } = options;

    if (!userRole) return assignments;

    console.log(`[AssignmentFilterService] CRITICAL FIX - Applying role-based filter for ${userRole} with includeUnpublished: ${includeUnpublished}`);

    switch (userRole) {
      case 'administrator':
      case 'skadeleder':
        // Admins and skadeleder can see all assignments (published + unpublished if allowed)
        const adminFiltered = assignments.filter(a => includeUnpublished || a.published);
        console.log(`[AssignmentFilterService] Admin/Skadeleder sees ${adminFiltered.length} assignments`);
        return adminFiltered;

      case 'servicemedarbejder':
        // CRITICAL FIX: For planner context, servicemedarbejder should see ALL published assignments
        // For dashboard context, they see only their assigned tasks (filtering happens at component level)
        const serviceFiltered = assignments.filter(a => a.published);
        console.log(`[AssignmentFilterService] CRITICAL FIX - Servicemedarbejder sees ${serviceFiltered.length} published assignments (ALL, not user-filtered)`);
        return serviceFiltered;

      default:
        // Default: only published assignments
        const defaultFiltered = assignments.filter(a => a.published);
        console.log(`[AssignmentFilterService] Default role sees ${defaultFiltered.length} published assignments`);
        return defaultFiltered;
    }
  }

  // Dashboard-specific filtering - preserves all employee names but filters to user's assignments
  static filterForDashboard(assignments: Assignment[], options: FilterOptions = {}): Assignment[] {
    const { userRole, userName } = options;

    if (!userRole) return [];

    console.log(`[AssignmentFilterService] CRITICAL FIX - Dashboard filtering for ${userRole} user: ${userName}`);

    if (userRole === 'servicemedarbejder') {
      // Filter to user's assignments but preserve ALL employee names
      const filtered = assignments.filter(a => 
        a.published && 
        a.employees && 
        a.employees.includes(userName || '')
      );
      console.log(`[AssignmentFilterService] Dashboard: Servicemedarbejder gets ${filtered.length} assignments with ALL colleague names preserved`);
      return filtered;
    }

    // Admin/Skadeleder see all their assigned or responsible assignments
    const filtered = assignments.filter(a => a.published);
    console.log(`[AssignmentFilterService] Dashboard: Admin/Skadeleder gets ${filtered.length} assignments`);
    return filtered;
  }

  // FIXED: CRITICAL FIX - Planner-specific filtering shows ALL assignments
  static filterForPlanner(assignments: Assignment[], options: FilterOptions = {}): Assignment[] {
    const { userRole, includeUnpublished = true } = options;

    if (!userRole) return [];

    console.log(`[AssignmentFilterService] CRITICAL FIX - Planner filtering for ${userRole} with includeUnpublished: ${includeUnpublished}`);

    if (userRole === 'servicemedarbejder') {
      // CRITICAL FIX: Servicemedarbejder should see ALL published assignments in planner
      const filtered = assignments.filter(a => a.published);
      console.log(`[AssignmentFilterService] CRITICAL FIX - Planner: Servicemedarbejder sees ${filtered.length} published assignments (ALL, not just assigned)`);
      return filtered;
    }

    // Admin/Skadeleder see all assignments (published + unpublished if allowed)
    const filtered = assignments.filter(a => includeUnpublished || a.published);
    console.log(`[AssignmentFilterService] Planner: Admin/Skadeleder sees ${filtered.length} assignments`);
    return filtered;
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
