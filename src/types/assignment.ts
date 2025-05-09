
export interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
  fromTime: string;
  toTime: string;
  location: string;
  car: string | { id: string; name: string } | null;
  employees: string[];
  published?: boolean;
  type?: string;
}

export interface GroupedAssignments {
  [key: string]: Assignment[];
}

// Helper functions
export const getCurrentWeek = (): number => {
  const now = new Date();
  
  // ISO 8601 week calculation
  const date = new Date(now.getTime());
  date.setHours(0, 0, 0, 0);
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  
  // Get first day of year
  const yearStart = new Date(date.getFullYear(), 0, 1);
  
  // Calculate full weeks to nearest Thursday
  const weekNum = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return weekNum;
};

// Helper function to calculate ISO week number
const getCurrentWeekOfYear = (date: Date): number => {
  // Create a copy of the date
  const d = new Date(date.getTime());
  
  // Set to the nearest Thursday (to match ISO 8601 week definition)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  
  // Get first day of year
  const yearStart = new Date(d.getFullYear(), 0, 1);
  
  // Calculate full weeks from first day of year to the Thursday
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const groupByDate = (assignments: Assignment[]): GroupedAssignments => {
  return assignments.reduce((groups: GroupedAssignments, assignment) => {
    const date = assignment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(assignment);
    return groups;
  }, {});
};
