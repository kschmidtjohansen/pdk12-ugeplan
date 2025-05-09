
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { formatDateWithCapital, getDateStatus } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
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
  canEdit: boolean;
  canPublishTasks: boolean;
}

const DaySection: React.FC<DaySectionProps> = ({
  dateKey,
  dayAssignments,
  isExpanded,
  onToggleExpansion,
  onPublishDay,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  canEdit,
  canPublishTasks
}) => {
  const { t, currentLanguage } = useTranslation();
  const formattedDate = formatDateWithCapital(dateKey, currentLanguage);
  const hasUnpublishedAssignments = dayAssignments.some(a => !a.published);

  // Determine task text based on language and count
  const taskText = currentLanguage === 'da' 
    ? (dayAssignments.length === 1 ? 'opgave' : 'opgaver')
    : (dayAssignments.length === 1 ? 'task' : 'tasks');

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => onToggleExpansion(dateKey)}
        >
          <h3 className="text-lg font-medium">
            {formattedDate}
          </h3>
          <div className="ml-2 text-sm text-gray-500">
            ({dayAssignments.length} {taskText})
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

export default DaySection;
