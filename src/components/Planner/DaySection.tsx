
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { formatDateWithCapital } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Send, CalendarX2 } from 'lucide-react';
import AssignmentCard from './AssignmentCard';

interface DaySectionProps {
  dateKey: string;
  dayAssignments: Assignment[];
  allAssignments?: Assignment[];
  operationStates: Record<string, 'publishing' | 'deleting' | 'updating' | null>;
  isExpanded: boolean;
  onToggleExpansion: (date: string) => void;
  onPublishDay?: (date: string) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onCopyAssignment?: (assignment: Assignment) => void;
  onViewDetails?: (assignment: Assignment) => void;
  canEdit: boolean;
  canPublishTasks: boolean;
  cars?: Car[];
  gridLayout?: boolean;
}

const DaySection: React.FC<DaySectionProps> = ({
  dateKey,
  dayAssignments = [],
  allAssignments = [],
  operationStates,
  isExpanded,
  onToggleExpansion,
  onPublishDay,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onCopyAssignment,
  onViewDetails,
  canEdit,
  canPublishTasks,
  cars = [],
  gridLayout = false
}) => {
  const { t, currentLanguage } = useTranslation();
  
  const formattedDate = formatDateWithCapital(dateKey, currentLanguage);
  const hasUnpublishedAssignments = Array.isArray(dayAssignments) && dayAssignments.some(a => !a.published);
  const assignmentsCount = Array.isArray(dayAssignments) ? dayAssignments.length : 0;

  const taskText = currentLanguage === 'da' 
    ? (assignmentsCount === 1 ? 'opgave' : 'opgaver')
    : (assignmentsCount === 1 ? 'task' : 'tasks');

  // Extract day number from dateKey (YYYY-MM-DD)
  const dayNumber = new Date(dateKey).getDate();

  const handlePublishDay = () => {
    if (onPublishDay) onPublishDay(dateKey);
  };

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      {isExpanded && assignmentsCount > 0 && (
        <div className="absolute left-5 top-14 bottom-4 w-px bg-border/40" />
      )}
      
      {/* Floating sticky day pill */}
      <div className="sticky top-16 z-20 flex items-center gap-3 mb-4">
        {/* Timeline dot with day number */}
        <button
          onClick={() => onToggleExpansion(dateKey)}
          className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 border-2 border-primary/30 flex items-center justify-center z-10 bg-background shrink-0 hover:bg-primary/20 transition-colors duration-200"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${formattedDate}`}
        >
          <span className="text-sm font-bold text-primary">{dayNumber}</span>
        </button>

        {/* Day label pill */}
        <button
          onClick={() => onToggleExpansion(dateKey)}
          className="inline-flex items-center px-4 py-1.5 rounded-full bg-background/80 dark:bg-card/80 backdrop-blur-md border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <span className="text-sm font-bold text-foreground">{formattedDate}</span>
          <span className="ml-2 text-xs text-muted-foreground">{assignmentsCount} {taskText}</span>
        </button>

        {/* Publish day button */}
        {canPublishTasks && hasUnpublishedAssignments && (
          <Button 
            onClick={handlePublishDay}
            className="bg-green-600 hover:bg-green-700 min-h-[44px] rounded-full"
            size="sm"
          >
            <Send className="mr-2 h-4 w-4" /> {t("planner.publishDayTasks")}
          </Button>
        )}
      </div>
      
      {/* Cards container with timeline offset */}
      {isExpanded && (
        <div className={`pl-12 space-y-3 ${gridLayout ? 'sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3 sm:space-y-0' : ''}`}>
          {Array.isArray(dayAssignments) && dayAssignments.length > 0 ? (
            dayAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                cars={cars}
                assignments={allAssignments}
                canEdit={canEdit}
                onEdit={() => onEditAssignment(assignment)}
                onDelete={() => onDeleteAssignment(assignment.id)}
                onPublish={onPublishAssignment ? () => onPublishAssignment(assignment.id) : undefined}
                onCopy={onCopyAssignment ? () => onCopyAssignment(assignment) : undefined}
                onViewDetails={onViewDetails ? () => onViewDetails(assignment) : undefined}
                operationState={operationStates[assignment.id]}
              />
            ))
          ) : (
            <div className="py-6 px-4 bg-background/50 dark:bg-card/50 backdrop-blur-sm border border-dashed border-border/30 rounded-2xl text-center text-muted-foreground">
              <CalendarX2 className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm">{t("planner.nothingPlannedToday")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DaySection;
