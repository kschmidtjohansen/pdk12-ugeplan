
/**
 * Helper functions for assignment data manipulation
 */
export const assignmentHelpers = {
  getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  },
  
  filterByWeek(assignments: any[], weekNumber: number) {
    return assignments.filter(assignment => {
      const date = new Date(assignment.date);
      const assignmentWeek = this.getWeekNumber(date);
      return assignmentWeek === weekNumber;
    });
  },
  
  formatEmployeeData(assignmentEmployees: any[]) {
    return assignmentEmployees?.map(ae => (ae as any).employees?.name || '') || [];
  }
};
