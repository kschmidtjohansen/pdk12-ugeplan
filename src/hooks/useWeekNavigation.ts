
import { useState } from 'react';
import { format, startOfWeek, addDays, getWeek, getYear } from 'date-fns';

export const useWeekNavigation = () => {
  const today = new Date();
  const [selectedWeek, setSelectedWeek] = useState(getWeek(today));
  const [selectedYear, setSelectedYear] = useState(getYear(today));

  // Calculate week dates
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => 
    addDays(startOfCurrentWeek, i)
  );

  const handlePreviousWeek = () => {
    if (selectedWeek === 1) {
      setSelectedWeek(52);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedWeek(selectedWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek === 52) {
      setSelectedWeek(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  return {
    selectedWeek,
    selectedYear,
    weekDates,
    handlePreviousWeek,
    handleNextWeek
  };
};
