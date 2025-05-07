
import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { format as formatDate, isToday, isFuture, isPast, parse, parseISO, startOfWeek, addDays } from 'date-fns';
import { Assignment } from '@/types/assignment';
import AssignmentCard from './AssignmentCard';
import EmptyState from './EmptyState';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

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

  // Filter assignments based on user permissions
  const visibleAssignments = canSeeUnpublishedTasks 
    ? assignments 
    : assignments.filter(assignment => assignment.published === true);

  // Group assignments by date
  const groupedAssignments = visibleAssignments.reduce<Record<string, Assignment[]>>(
    (acc, assignment) => {
      const dateKey = formatDate(new Date(assignment.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(assignment);
      return acc;
    },
    {}
  );

  // Create a date for each day of the week
  const getAllWeekDays = () => {
    if (!weekDates) return [];

    const days = [];
    let currentDay = new Date(weekDates.start);

    while (currentDay <= weekDates.end) {
      days.push(formatDate(currentDay, 'yyyy-MM-dd'));
      currentDay = addDays(currentDay, 1);
    }

    return days;
  };

  // Fill in any missing days
  const allWeekDays = getAllWeekDays();
  allWeekDays.forEach(dateKey => {
    if (!groupedAssignments[dateKey]) {
      groupedAssignments[dateKey] = [];
    }
  });

  // Custom sorting function for dates
  const sortDates = (dates: string[]) => {
    return dates.sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      
      // Check if today
      const aIsToday = isToday(dateA);
      const bIsToday = isToday(dateB);
      
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      
      // Check if future or past
      const aIsFuture = isFuture(dateA);
      const bIsFuture = isFuture(dateB);
      const aIsPast = isPast(dateA);
      const bIsPast = isPast(dateB);
      
      if (aIsFuture && bIsPast) return -1;
      if (aIsPast && bIsFuture) return 1;
      
      // If both are future or both are past, sort by date
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Sort dates with today first, then future days, then past days
  const sortedDates = sortDates(Object.keys(groupedAssignments));

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

  // Format date with capitalized first letter
  const formatDateWithCapital = (date: string) => {
    const dateObj = new Date(date);
    // Get localized date string
    const formattedDate = dateObj.toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    
    // Capitalize first letter
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  };

  // Check if all assignments for a date are published
  const isDateFullyPublished = (date: string) => {
    const dateAssignments = groupedAssignments[date] || [];
    return dateAssignments.length > 0 && dateAssignments.every(a => a.published === true);
  };

  // Check if there are any visible assignments after filtering
  if (visibleAssignments.length === 0 && allWeekDays.length === 0) {
    return <EmptyState onCreateNew={onCreateAssignment} canCreate={canCreate} selectedWeek={selectedWeek} />;
  }

  return (
    <div className="w-full space-y-6">
      {sortedDates.map((dateKey) => {
        const isExpanded = expandedDays[dateKey] !== false; // Default to expanded
        const dayAssignments = groupedAssignments[dateKey];
        const hasUnpublishedAssignments = dayAssignments.some(a => !a.published);
        
        return (
          <div key={dateKey} className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => toggleDayExpansion(dateKey)}
              >
                <h3 className="text-lg font-medium">
                  {formatDateWithCapital(dateKey)}
                </h3>
                <div className="ml-2 text-sm text-gray-500">
                  ({dayAssignments.length} {dayAssignments.length === 1 ? 'opgave' : 'opgaver'})
                </div>
              </div>
              
              {canPublishTasks && hasUnpublishedAssignments && onPublishDay && (
                <Button 
                  onClick={onPublishDay}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Send className="mr-2 h-4 w-4" /> {t("planner.publishDayTasks")}
                </Button>
              )}
            </div>
            
            {isExpanded && (
              <div className="w-full grid grid-cols-1 gap-4">
                {dayAssignments.length > 0 ? (
                  dayAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      canEdit={canEdit}
                      onEdit={() => onEditAssignment(assignment)}
                      onDelete={() => onDeleteAssignment(assignment.id)}
                      onPublish={onPublishAssignment ? () => onPublishAssignment(assignment.id) : undefined}
                    />
                  ))
                ) : (
                  <div className="p-4 border border-dashed rounded-md text-center text-gray-500">
                    {t("planner.nothingPlannedToday")}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AssignmentList;
