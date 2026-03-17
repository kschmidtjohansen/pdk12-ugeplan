
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { formatDateWithCapital } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Send, ChevronRight, CalendarX2 } from 'lucide-react';
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
  dateKey, dayAssignments = [], allAssignments = [], operationStates,
  isExpanded, onToggleExpansion, onPublishDay, onEditAssignment,
  onDeleteAssignment, onPublishAssignment, onCopyAssignment, onViewDetails,
  canEdit, canPublishTasks, cars = [], gridLayout = false
}) => {
  const { t, currentLanguage } = useTranslation();
  const formattedDate = formatDateWithCapital(dateKey, currentLanguage);
  const hasUnpublishedAssignments = Array.isArray(dayAssignments) && dayAssignments.some(a => !a.published);
  const assignmentsCount = Array.isArray(dayAssignments) ? dayAssignments.length : 0;
  const taskText = currentLanguage === 'da' 
    ? (assignmentsCount === 1 ? 'opgave' : 'opgaver')
    : (assignmentsCount === 1 ? 'task' : 'tasks');

  return (
    <div className="glass-card rounded-lg border overflow-hidden">
      {/* Day Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div 
          className="flex items-center cursor-pointer hover:bg-muted/50 rounded-md p-1.5 -m-1.5 transition-colors duration-200" 
          onClick={() => onToggleExpansion(dateKey)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpansion(dateKey); } }}
          aria-expanded={isExpanded}
        >
          <ChevronRight className={`h-4 w-4 text-muted-foreground mr-2 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
          <h3 className="text-sm font-semibold select-none">{formattedDate}</h3>
          <span className="ml-2 text-xs text-muted-foreground font-medium select-none">
            {assignmentsCount} {taskText}
          </span>
        </div>
        
        {canPublishTasks && hasUnpublishedAssignments && (
          <Button onClick={() => onPublishDay?.(dateKey)} size="sm" className="h-8 text-xs">
            <Send className="mr-1 h-3.5 w-3.5" /> {t("planner.publishDayTasks")}
          </Button>
        )}
      </div>
      
      {/* Assignments */}
      {isExpanded && (
        <div className={`px-4 pb-4 grid gap-3 ${gridLayout ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
          {Array.isArray(dayAssignments) && dayAssignments.length > 0 ? (
            dayAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id} assignment={assignment} cars={cars} assignments={allAssignments}
                canEdit={canEdit} onEdit={() => onEditAssignment(assignment)}
                onDelete={() => onDeleteAssignment(assignment.id)}
                onPublish={onPublishAssignment ? () => onPublishAssignment(assignment.id) : undefined}
                onCopy={onCopyAssignment ? () => onCopyAssignment(assignment) : undefined}
                onViewDetails={onViewDetails ? () => onViewDetails(assignment) : undefined}
                operationState={operationStates[assignment.id]}
              />
            ))
          ) : (
            <div className="py-6 text-center text-muted-foreground border border-dashed border-border/40 rounded-md">
              <CalendarX2 className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
              <p className="text-sm">{t("planner.nothingPlannedToday")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DaySection;
