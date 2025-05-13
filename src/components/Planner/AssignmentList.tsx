
import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import EmptyState from './EmptyState';
import { getAllWeekDays, getDateStatus } from '@/utils/dateUtils';
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters';
import CurrentAndFutureDays from './CurrentAndFutureDays';
import PastAssignments from './PastAssignments';
import { format } from 'date-fns'; // Added missing import

interface AssignmentListProps {
  assignments: Assignment[];
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onPublishDay?: () => void;
  onCreateAssignment: (date: string) => void;
  selectedWeek?: number;
  selectedYear?: number;
  weekDates?: { start: Date; end: Date; weekNumber: number; year: number };
}

const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onPublishDay,
  onCreateAssignment,
  selectedWeek,
  selectedYear,
  weekDates
}) => {
  const { 
    canEdit, 
    canCreate, 
    canSeeUnpublishedTasks,
    canPublishTasks 
  } = usePermissions();
  const { t } = useTranslation();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const { filterByPermissions, groupByDate } = useAssignmentFilters();

  // Filter assignments based on user permissions
  const visibleAssignments = filterByPermissions(assignments, canSeeUnpublishedTasks);

  // Group assignments by date
  const groupedAssignments = groupByDate(visibleAssignments);
  
  // FIXED: Create array of weekdays - ONLY if weekDates is provided
  let allWeekDays: string[] = [];
  
  if (weekDates?.start && weekDates?.end) {
    console.log("FIXED AssignmentList: Creating week days for", 
      format(weekDates.start, 'yyyy-MM-dd'), "to", 
      format(weekDates.end, 'yyyy-MM-dd')
    );
    
    // FIXED: Make sure dates are proper date objects, not strings or timestamps
    allWeekDays = getAllWeekDays({ 
      start: new Date(weekDates.start), 
      end: new Date(weekDates.end)
    });
  } else {
    console.warn("FIXED AssignmentList: No weekDates provided, can't create week days");
  }
  
  // FIXED: Better debug logging of the week days
  console.log("FIXED AssignmentList - Week days from getAllWeekDays:", allWeekDays);
  if (allWeekDays.length > 0) {
    const firstDay = new Date(allWeekDays[0]);
    const lastDay = new Date(allWeekDays[allWeekDays.length-1]);
    console.log(`FIXED AssignmentList - First day: ${format(firstDay, 'yyyy-MM-dd')} (${format(firstDay, 'EEEE')}) - Day of week: ${firstDay.getDay()}`);
    console.log(`FIXED AssignmentList - Last day: ${format(lastDay, 'yyyy-MM-dd')} (${format(lastDay, 'EEEE')}) - Day of week: ${lastDay.getDay()}`);
  }

  // Fill in any missing days from the week
  allWeekDays.forEach(dateKey => {
    if (!groupedAssignments[dateKey]) {
      groupedAssignments[dateKey] = [];
    }
  });

  // Separate dates into today, future, and past
  const todayDate: string[] = [];
  const futureDates: string[] = [];
  const pastDates: string[] = [];
  
  Object.keys(groupedAssignments).forEach(date => {
    const status = getDateStatus(date);
    if (status === 'today') {
      todayDate.push(date);
    } else if (status === 'future') {
      futureDates.push(date);
    } else if (status === 'past') {
      pastDates.push(date);
    }
  });

  // Sort future dates (ascending)
  futureDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  // Sort past dates (descending - newest first)
  pastDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Effect to update time at midnight to refresh sorting
  useEffect(() => {
    // Calculate time until midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set timeout to update at midnight
    const midnightTimer = setTimeout(() => {
      setCurrentTime(new Date());
    }, timeUntilMidnight);
    
    return () => clearTimeout(midnightTimer);
  }, [currentTime]);

  // Toggle day expansion
  const toggleDayExpansion = (date: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Check if there are any visible assignments after filtering
  if (visibleAssignments.length === 0 && allWeekDays.length === 0) {
    return <EmptyState onCreateNew={onCreateAssignment} canCreate={canCreate} selectedWeek={selectedWeek} />;
  }

  return (
    <div className="w-full space-y-6">
      {/* Today's date and future dates section */}
      <CurrentAndFutureDays 
        dates={[...todayDate, ...futureDates]}
        groupedAssignments={groupedAssignments}
        expandedDays={expandedDays}
        onToggleExpansion={toggleDayExpansion}
        onPublishDay={onPublishDay}
        onEditAssignment={onEditAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onPublishAssignment={onPublishAssignment}
        canEdit={canEdit}
        canPublishTasks={canPublishTasks}
      />
      
      {/* Past dates section */}
      <PastAssignments 
        pastDates={pastDates}
        groupedAssignments={groupedAssignments}
        expandedDays={expandedDays}
        onToggleExpansion={toggleDayExpansion}
        onPublishDay={onPublishDay}
        onEditAssignment={onEditAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onPublishAssignment={onPublishAssignment}
        canEdit={canEdit}
        canPublishTasks={canPublishTasks}
      />
    </div>
  );
};

export default AssignmentList;
