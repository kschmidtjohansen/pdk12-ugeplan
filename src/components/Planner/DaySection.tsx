
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { formatDateWithCapital, getDateStatus } from '@/utils/dateUtils';
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
  
  if (import.meta.env.DEV) {
    console.log(`Formatted date for ${dateKey}: ${formattedDate} (${currentLanguage})`);
  }
  
  const hasUnpublishedAssignments = Array.isArray(dayAssignments) && dayAssignments.some(a => !a.published);
  const assignmentsCount = Array.isArray(dayAssignments) ? dayAssignments.length : 0;

  const taskText = currentLanguage === 'da' 
    ? (assignmentsCount === 1 ? 'opgave' : 'opgaver')
    : (assignmentsCount === 1 ? 'task' : 'tasks');

  const handlePublishDay = () => {
    if (onPublishDay) {
      if (import.meta.env.DEV) console.log('[DaySection] Publishing day:', dateKey);
      onPublishDay(dateKey);
    }
  };

  return (
    <div className="border border-border/40 rounded-2xl bg-card shadow-sm overflow-hidden">
      {/* Day Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3">
        <div 
          className="flex items-center cursor-pointer hover:bg-muted/50 rounded-lg p-1.5 -m-1.5 transition-colors duration-200" 
          onClick={() => onToggleExpansion(dateKey)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleExpansion(dateKey);
            }
          }}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} assignments for ${formattedDate}`}
        >
          <ChevronRight className={`h-4 w-4 text-muted-foreground mr-2 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
          
          <h3 className="text-lg font-semibold select-none tracking-tight">
            {formattedDate}
          </h3>
          <span className="ml-2.5 bg-muted text-muted-foreground text-xs font-medium px-2.5 py-0.5 rounded-full select-none">
            {assignmentsCount} {taskText}
          </span>
        </div>
        
        {canPublishTasks && hasUnpublishedAssignments && (
          <Button 
            onClick={handlePublishDay}
            className="bg-green-600 hover:bg-green-700 min-h-[44px]"
            size="sm"
          >
            <Send className="mr-2 h-4 w-4" /> {t("planner.publishDayTasks")}
          </Button>
        )}
      </div>
      
      {/* Assignments */}
      {isExpanded && (
        <div className={`px-4 sm:px-5 pb-4 sm:pb-5 grid gap-4 ${gridLayout ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
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
            <div className="py-8 px-4 bg-muted/10 border border-dashed border-border/30 rounded-xl text-center text-muted-foreground">
              <CalendarX2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p>{t("planner.nothingPlannedToday")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DaySection;
