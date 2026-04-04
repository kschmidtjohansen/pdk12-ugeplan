
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { formatDateWithCapital, getDateStatus } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Send, ChevronDown, ChevronRight, CalendarX2 } from 'lucide-react';
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
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors duration-200" 
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
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground mr-2 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground mr-2 transition-transform duration-200" />
          )}
          
          <h3 className="text-lg font-medium select-none">
            {formattedDate}
          </h3>
          <div className="ml-2 text-sm text-muted-foreground select-none">
            ({assignmentsCount} {taskText})
          </div>
        </div>
        
        {canPublishTasks && hasUnpublishedAssignments && (
          <Button 
            onClick={handlePublishDay}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Send className="mr-2 h-4 w-4" /> {t("planner.publishDayTasks")}
          </Button>
        )}
      </div>
      
      {isExpanded && (
        <div className={`w-full grid gap-4 animate-in slide-in-from-top-2 duration-200 ${gridLayout ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
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
            <div className="py-8 px-4 rounded-2xl text-center text-muted-foreground bg-slate-50 dark:bg-slate-800/50">
              <CalendarX2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p>{t("planner.nothingPlannedToday")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DaySection;
