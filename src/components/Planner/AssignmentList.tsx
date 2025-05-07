
import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import EmptyState from './EmptyState';
import { getAllWeekDays, getDateStatus } from '@/utils/dateUtils';
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters';
import DaySection from './DaySection';

interface AssignmentListProps {
  assignments: Assignment[];
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onPublishDay?: () => void;
  onCreateAssignment: (date: string) => void;
  selectedWeek?: number;
  weekDates?: { start: Date; end: Date };
}

const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onPublishDay,
  onCreateAssignment,
  selectedWeek,
  weekDates
}) => {
  const { canEdit, canCreate, canSeeUnpublishedTasks, canPublishTasks } = usePermissions();
  const { t } = useTranslation();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const { filterByPermissions, groupByDate } = useAssignmentFilters();

  // Filter assignments based on user permissions
  const visibleAssignments = filterByPermissions(assignments, canSeeUnpublishedTasks);

  // Group assignments by date
  const groupedAssignments = groupByDate(visibleAssignments);
  
  // Create a date for each day of the week
  const allWeekDays = weekDates ? getAllWeekDays(weekDates) : [];

  // Fill in any missing days
  allWeekDays.forEach(dateKey => {
    if (!groupedAssignments[dateKey]) {
      groupedAssignments[dateKey] = [];
    }
  });

  // Separate dates into current/future and past
  const currentAndFutureDates: string[] = [];
  const pastDates: string[] = [];
  
  Object.keys(groupedAssignments).forEach(date => {
    const status = getDateStatus(date);
    if (status === 'today' || status === 'future') {
      currentAndFutureDates.push(date);
    } else if (status === 'past') {
      pastDates.push(date);
    }
  });

  // Sort by date (ascending)
  currentAndFutureDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  pastDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

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
      {/* Current and future dates section */}
      {currentAndFutureDates.map(dateKey => (
        <DaySection 
          key={dateKey}
          dateKey={dateKey}
          dayAssignments={groupedAssignments[dateKey]}
          isExpanded={expandedDays[dateKey] !== false} // Default to expanded
          onToggleExpansion={toggleDayExpansion}
          onPublishDay={onPublishDay}
          onEditAssignment={onEditAssignment}
          onDeleteAssignment={onDeleteAssignment}
          onPublishAssignment={onPublishAssignment}
          canEdit={canEdit}
          canPublishTasks={canPublishTasks}
        />
      ))}
      
      {/* Past dates section with header */}
      {pastDates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
            {t("planner.previousTasks")}
          </h2>
          <div className="space-y-6">
            {pastDates.map(dateKey => (
              <DaySection 
                key={dateKey}
                dateKey={dateKey}
                dayAssignments={groupedAssignments[dateKey]}
                isExpanded={expandedDays[dateKey] !== false} // Default to expanded
                onToggleExpansion={toggleDayExpansion}
                onPublishDay={onPublishDay}
                onEditAssignment={onEditAssignment}
                onDeleteAssignment={onDeleteAssignment}
                onPublishAssignment={onPublishAssignment}
                canEdit={canEdit}
                canPublishTasks={canPublishTasks}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentList;
