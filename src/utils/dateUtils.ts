
// Group assignments by day (YYYY-MM-DD format)
export const groupAssignmentsByDay = (assignments: any[]) => {
  return assignments.reduce((acc, assignment) => {
    const date = assignment.date ? assignment.date.split('T')[0] : 'Unknown';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(assignment);
    return acc;
  }, {});
};

// Format date with capital first letter
export const formatDateWithCapital = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  // Format like: Monday, January 1
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  
  return formattedDate;
};

// Get all days in a week (for an inclusive date range)
export const getAllWeekDays = ({ start, end }: { start: Date, end: Date }): string[] => {
  const days: string[] = [];
  const currentDate = new Date(start);
  
  // Set to beginning of the day
  currentDate.setHours(0, 0, 0, 0);
  
  // Loop through each day until the end date
  while (currentDate <= end) {
    const dateString = currentDate.toISOString().split('T')[0];
    days.push(dateString);
    
    // Go to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};

// Determine if a date is in the past, today, or in the future
export const getDateStatus = (dateString: string): 'past' | 'today' | 'future' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  
  if (date.getTime() < today.getTime()) {
    return 'past';
  } else if (date.getTime() === today.getTime()) {
    return 'today';
  } else {
    return 'future';
  }
};
