
// This file is a partial update to fix the date comparison logic
// for the isEmployeeOnVacation function in EmployeeSelector.tsx

// The key fix is to make employees available on the day after their vacation ends
// by changing the comparison from selectedDate <= endDate to selectedDate < endDate

const isEmployeeOnVacation = (employeeId: string, selectedDate: Date) => {
  return vacations.some(vacation => {
    if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
      return false;
    }
    
    const startDate = new Date(vacation.startDate);
    const endDate = new Date(vacation.endDate);
    
    // Normalize dates to avoid time comparison issues
    selectedDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Fix: Employee is available on the day after their vacation ends
    // Changed from 'selectedDate <= endDate' to 'selectedDate < endDate'
    return selectedDate >= startDate && selectedDate < endDate;
  });
};
