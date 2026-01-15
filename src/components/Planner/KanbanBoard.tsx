import React, { useState, useMemo, useEffect } from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { useTranslation } from '@/context/TranslationContext';
import { groupAssignmentsByDay } from '@/utils/dateUtils';
import { getAllWeekDays } from '@/utils/dates';
import { format, isToday, parseISO } from 'date-fns';
import KanbanColumn from './KanbanColumn';
import KanbanDayNavigation from './KanbanDayNavigation';
import KanbanCard from './KanbanCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { useToast } from '@/hooks/use-toast';

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
  onMoveAssignment?: (assignmentId: string, newDate: string) => Promise<void>;
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
  onMoveAssignment,
  selectedWeek,
  selectedYear
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // State for drag-and-drop
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  
  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );
  
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
  
  // Drag-and-drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const assignment = active.data.current?.assignment as Assignment;
    if (assignment) {
      setActiveAssignment(assignment);
    }
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveAssignment(null);
    
    if (!over || !onMoveAssignment) return;
    
    const assignmentId = active.id as string;
    const newDate = over.id as string;
    const assignment = active.data.current?.assignment as Assignment;
    
    // Don't do anything if dropped on the same day
    if (assignment?.date === newDate) return;
    
    try {
      await onMoveAssignment(assignmentId, newDate);
      toast({
        title: t('planner.movedSuccess'),
        description: t('planner.movedSuccessMsg'),
      });
    } catch (error) {
      console.error('Failed to move assignment:', error);
      toast({
        title: t('planner.moveError'),
        variant: 'destructive',
      });
    }
  };
  
  const handleDragCancel = () => {
    setActiveAssignment(null);
  };

  if (weekDateStrings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('planner.noAssignmentsWeek')}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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
            <div key={dateKey} className="min-h-[500px] max-h-[calc(100vh-350px)]">
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
      
      {/* Drag Overlay - shows the card being dragged */}
      <DragOverlay dropAnimation={null}>
        {activeAssignment ? (
          <div className="w-80 opacity-90">
            <KanbanCard
              assignment={activeAssignment}
              cars={cars}
              canEdit={false}
              onEdit={() => {}}
              onDelete={() => {}}
              operationState={null}
              isDraggable={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
