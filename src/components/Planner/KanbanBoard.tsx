import React, { useState, useMemo, useEffect } from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { useTranslation } from '@/context/TranslationContext';
import { groupAssignmentsByDay } from '@/utils/dateUtils';
import { getAllWeekDays } from '@/utils/dates';
import { format } from 'date-fns';
import KanbanColumn from './KanbanColumn';
import KanbanDayNavigation from './KanbanDayNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface KanbanBoardProps {
  weekAssignments: Assignment[];
  cars: Car[];
  operationStates: Record<string, 'publishing' | 'deleting' | 'updating' | null>;
  canEdit: boolean;
  canPublishTasks: boolean;
  weekDates: { start: Date; end: Date };
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment: (assignmentId: string) => void;
  onCopyAssignment: (assignment: Assignment) => void;
  onPublishDay: (date: string) => void;
  onCreateAssignment: (date: string) => void;
  selectedWeek: number;
  selectedYear: number;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  weekAssignments = [],
  cars,
  operationStates,
  canEdit,
  canPublishTasks,
  weekDates,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onCopyAssignment,
  onPublishDay,
  onCreateAssignment,
  selectedWeek,
  selectedYear
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  // Show 1 day at a time (tasks shown in 2 columns within the day)
  const columnsToShow = 1;
  
  // Generate week date strings
  const weekDateStrings = useMemo(() => {
    if (!weekDates?.start || !weekDates?.end) return [];
    return getAllWeekDays({ start: weekDates.start, end: weekDates.end });
  }, [weekDates]);
  
  // Find today's index to start there
  const todayIndex = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const index = weekDateStrings.findIndex(d => d === todayStr);
    return index >= 0 ? index : 0;
  }, [weekDateStrings]);
  
  // Initialize visible start index based on today
  const [visibleStartIndex, setVisibleStartIndex] = useState(() => {
    // Ensure we don't go past the end
    const maxStart = Math.max(0, weekDateStrings.length - columnsToShow);
    return Math.min(todayIndex, maxStart);
  });
  
  // Update visible index when columns to show changes
  useEffect(() => {
    const maxStart = Math.max(0, weekDateStrings.length - columnsToShow);
    if (visibleStartIndex > maxStart) {
      setVisibleStartIndex(maxStart);
    }
  }, [columnsToShow, weekDateStrings.length, visibleStartIndex]);
  
  // Group assignments by day
  const groupedAssignments = useMemo(() => {
    return groupAssignmentsByDay(weekAssignments);
  }, [weekAssignments]);
  
  // Get visible dates
  const visibleDates = useMemo(() => {
    return weekDateStrings.slice(visibleStartIndex, visibleStartIndex + columnsToShow);
  }, [weekDateStrings, visibleStartIndex, columnsToShow]);
  
  const handleNavigate = (direction: 'prev' | 'next') => {
    setVisibleStartIndex(prev => {
      if (direction === 'prev') {
        return Math.max(0, prev - 1);
      } else {
        return Math.min(weekDateStrings.length - columnsToShow, prev + 1);
      }
    });
  };

  if (weekDateStrings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('planner.noAssignmentsWeek')}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Day Navigation */}
      <KanbanDayNavigation
        weekDates={weekDateStrings}
        visibleStartIndex={visibleStartIndex}
        columnsToShow={columnsToShow}
        onNavigate={handleNavigate}
      />
      
      {/* Kanban Columns */}
      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${columnsToShow}, minmax(0, 1fr))` 
        }}
      >
        {visibleDates.map(dateKey => (
          <div key={dateKey} className="min-h-[500px]">
            <KanbanColumn
              dateKey={dateKey}
              assignments={groupedAssignments[dateKey] || []}
              cars={cars}
              operationStates={operationStates}
              canEdit={canEdit}
              canPublishTasks={canPublishTasks}
              onEditAssignment={onEditAssignment}
              onDeleteAssignment={onDeleteAssignment}
              onPublishAssignment={onPublishAssignment}
              onCopyAssignment={onCopyAssignment}
              onPublishDay={onPublishDay}
              onCreateAssignment={onCreateAssignment}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
