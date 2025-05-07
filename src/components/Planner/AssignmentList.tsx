
import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { format as formatDate, isToday, isPast } from 'date-fns';
import { Assignment } from '@/types/assignment';
import AssignmentCard from './AssignmentCard';
import EmptyState from './EmptyState';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { getAllWeekDays, formatDateWithCapital, getDateStatus } from '@/utils/dateUtils';
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters';

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

  // Check if all assignments for a date are published
  const isDateFullyPublished = (date: string) => {
    const dateAssignments = groupedAssignments[date] || [];
    return dateAssignments.length > 0 && dateAssignments.every(a => a.published === true);
  };

  // Check if there are any visible assignments after filtering
  if (visibleAssignments.length === 0 && allWeekDays.length === 0) {
    return <EmptyState onCreateNew={onCreateAssignment} canCreate={canCreate} selectedWeek={selectedWeek} />;
  }

  // Render a day section
  const renderDaySection = (dateKey: string) => {
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
  };

  return (
    <div className="w-full space-y-6">
      {/* Current and future dates section */}
      {currentAndFutureDates.map(renderDaySection)}
      
      {/* Past dates section with header */}
      {pastDates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
            {t("planner.previousTasks")}
          </h2>
          <div className="space-y-6">
            {pastDates.map(renderDaySection)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentList;
