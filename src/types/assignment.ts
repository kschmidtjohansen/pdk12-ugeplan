
export interface Assignment {
  id: string;
  title: string;
  description: string;
  date: string;
  fromTime: string;
  toTime: string;
  location: string;
  car: string;
  employees: string[];
}

export interface GroupedAssignments {
  [key: string]: Assignment[];
}

// Helper functions
export const getCurrentWeek = (): number => {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return weekNum;
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
