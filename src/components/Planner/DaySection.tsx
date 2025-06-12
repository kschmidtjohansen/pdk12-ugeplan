
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { formatDateWithCapital, getDateStatus } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Send, ChevronDown, ChevronRight } from 'lucide-react';
import AssignmentCard from './AssignmentCard';

interface DaySectionProps {
  dateKey: string;
  dayAssignments: Assignment[];
  isExpanded: boolean;
  onToggleExpansion: (date: string) => void;
  onPublishDay?: () => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onCopyAssignment?: (assignment: Assignment) => void;
  canEdit: boolean;
  canPublishTasks: boolean;
  cars?: Car[];
}

const DaySection: React.FC<DaySectionProps> = ({
  dateKey,
  dayAssignments = [], // Initialize with empty array as fallback
  isExpanded,
  onToggleExpansion,
  onPublishDay,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onCopyAssignment,
  canEdit,
  canPublishTasks,
  cars = []
}) => {
  const { t, currentLanguage } = useTranslation();
  
  // Use the formatDateWithCapital function with the current language
  const formattedDate = formatDateWithCapital(dateKey, currentLanguage);
  
  // Log the formatted date for troubleshooting
  console.log(`Formatted date for ${dateKey}: ${formattedDate} (${currentLanguage})`);
  
  // Fix: Make sure dayAssignments is an array before calling some()
  const hasUnpublishedAssignments = Array.isArray(dayAssignments) && dayAssignments.some(a => !a.published);

  // Ensure dayAssignments is an array and then get its length
  const assignmentsCount = Array.isArray(dayAssignments) ? dayAssignments.length : 0;

  // Determine task text based on language and count
  const taskText = currentLanguage === 'da' 
    ? (assignmentsCount === 1 ? 'opgave' : 'opgaver')
    : (assignmentsCount === 1 ? 'task' : 'tasks');

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200" 
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
          {/* Chevron icon to indicate expand/collapse state */}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500 mr-2 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500 mr-2 transition-transform duration-200" />
          )}
          
          <h3 className="text-lg font-medium select-none">
            {formattedDate}
          </h3>
          <div className="ml-2 text-sm text-gray-500 select-none">
            ({assignmentsCount} {taskText})
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
        <div className="w-full grid grid-cols-1 gap-4 animate-in slide-in-from-top-2 duration-200">
          {Array.isArray(dayAssignments) && dayAssignments.length > 0 ? (
            dayAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                cars={cars}
                canEdit={canEdit}
                onEdit={() => onEditAssignment(assignment)}
                onDelete={() => onDeleteAssignment(assignment.id)}
                onPublish={onPublishAssignment ? () => onPublishAssignment(assignment.id) : undefined}
                onCopy={onCopyAssignment ? () => onCopyAssignment(assignment) : undefined}
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

export default DaySection;
