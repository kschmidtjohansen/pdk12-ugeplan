import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { formatDateWithCapital } from '@/utils/dateUtils';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { da } from 'date-fns/locale';
import { Plus, Send } from 'lucide-react';
import KanbanCard from './KanbanCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  dateKey: string;
  assignments: Assignment[];
  cars: Car[];
  operationStates: Record<string, 'publishing' | 'deleting' | 'updating' | null>;
  canEdit: boolean;
  canPublishTasks: boolean;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onCopyAssignment?: (assignment: Assignment) => void;
  onPublishDay?: (date: string) => void;
  onCreateAssignment?: (date: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  dateKey,
  assignments = [],
  cars,
  operationStates,
  canEdit,
  canPublishTasks,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onCopyAssignment,
  onPublishDay,
  onCreateAssignment
}) => {
  const { t, currentLanguage } = useTranslation();
  
  const parsedDate = parseISO(dateKey);
  const isTodayDate = isToday(parsedDate);
  const isPastDate = isPast(parsedDate) && !isTodayDate;
  
  const dayName = format(parsedDate, 'EEEE', { locale: currentLanguage === 'da' ? da : undefined });
  const dayNumber = format(parsedDate, 'd');
  const monthName = format(parsedDate, 'MMMM', { locale: currentLanguage === 'da' ? da : undefined });
  
  const hasUnpublishedAssignments = assignments.some(a => !a.published);
  const assignmentCount = assignments.length;
  const publishedCount = assignments.filter(a => a.published).length;

  const taskText = currentLanguage === 'da' 
    ? (assignmentCount === 1 ? 'opgave' : 'opgaver')
    : (assignmentCount === 1 ? 'task' : 'tasks');

  return (
    <div 
      className={cn(
        "flex flex-col h-full min-w-0 rounded-xl border transition-all duration-200",
        isTodayDate 
          ? "bg-primary/5 border-primary/30" 
          : isPastDate 
            ? "bg-muted/30 border-border/50" 
            : "bg-card border-border"
      )}
    >
      {/* Column Header */}
      <div className={cn(
        "p-4 border-b",
        isTodayDate ? "border-primary/20" : "border-border"
      )}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-lg font-semibold capitalize",
              isTodayDate ? "text-primary" : isPastDate ? "text-muted-foreground" : "text-foreground"
            )}>
              {dayName}
            </span>
            {isTodayDate && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                {t('planner.today')}
              </span>
            )}
          </div>
        </div>
        
        <div className={cn(
          "text-sm",
          isPastDate ? "text-muted-foreground/70" : "text-muted-foreground"
        )}>
          {dayNumber}. {monthName}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className={cn(
            "text-xs",
            isPastDate ? "text-muted-foreground/60" : "text-muted-foreground"
          )}>
            {assignmentCount} {taskText}
            {publishedCount > 0 && assignmentCount > publishedCount && (
              <span className="text-muted-foreground/60"> · {publishedCount} {currentLanguage === 'da' ? 'aftalt' : 'published'}</span>
            )}
          </span>
          
          {canPublishTasks && hasUnpublishedAssignments && onPublishDay && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPublishDay(dateKey)}
              className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Send className="h-3 w-3 mr-1" />
              {currentLanguage === 'da' ? 'Udgiv' : 'Publish'}
            </Button>
          )}
        </div>
      </div>
      
      {/* Column Content - No ScrollArea, natural flow */}
      <div className="flex-1 p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assignments.length > 0 ? (
            assignments.map(assignment => (
              <KanbanCard
                key={assignment.id}
                assignment={assignment}
                cars={cars}
                canEdit={canEdit && !isPastDate}
                onEdit={() => onEditAssignment(assignment)}
                onDelete={() => onDeleteAssignment(assignment.id)}
                onPublish={onPublishAssignment ? () => onPublishAssignment(assignment.id) : undefined}
                onCopy={onCopyAssignment ? () => onCopyAssignment(assignment) : undefined}
                operationState={operationStates[assignment.id]}
              />
            ))
          ) : (
            <div className={cn(
              "text-center py-8 text-sm col-span-full",
              isPastDate ? "text-muted-foreground/50" : "text-muted-foreground"
            )}>
              {t('planner.nothingPlannedToday')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;
