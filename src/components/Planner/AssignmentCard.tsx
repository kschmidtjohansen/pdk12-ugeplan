
import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Assignment } from '@/types/assignment';
import { formatDateWithCapital } from '@/utils/dateUtils';
import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';
import AssignmentActionButtons from './AssignmentActionButtons';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import { MapPin, Clock } from 'lucide-react';

interface AssignmentCardProps {
  assignment: Assignment;
  canManage?: boolean;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
  onPublish?: (assignmentId: string) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  canManage = false,
  onEdit,
  onDelete,
  onPublish
}) => {
  const { currentLanguage, t } = useTranslation();
  
  // Format time to show only hours and minutes (HH:MM)
  const formatTimeWithoutSeconds = (timeString: string) => {
    if (!timeString) return '';
    return timeString.split(':').slice(0, 2).join(':');
  };
  
  // Format the assignment times
  const formattedFromTime = formatTimeWithoutSeconds(assignment.fromTime);
  const formattedToTime = formatTimeWithoutSeconds(assignment.toTime);
  
  return (
    <Card className={cn(
      "overflow-hidden",
      !assignment.published && "border-l-4 border-yellow-500"
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between">
          <h3 className="font-medium">{assignment.title}</h3>
          <AssignmentStatusBadge published={assignment.published} />
        </div>
        
        <div className="mt-2 text-gray-700">
          <div className="flex items-center text-sm mt-1">
            <Clock className="h-4 w-4 mr-1 text-gray-500" />
            <span>{formattedFromTime} - {formattedToTime}</span>
          </div>
          
          {assignment.location && (
            <div className="flex items-center text-sm mt-1">
              <MapPin className="h-4 w-4 mr-1 text-gray-500" />
              <span>{assignment.location}</span>
            </div>
          )}
        </div>
        
        {assignment.description && (
          <div className="mt-3 text-sm text-gray-600">
            {assignment.description}
          </div>
        )}
        
        <div className="mt-3">
          <div className="flex flex-wrap gap-1">
            {assignment.employees && assignment.employees.map((employee, index) => (
              <Badge key={index} variant="outline" className="bg-blue-50">
                {employee}
              </Badge>
            ))}
            {(!assignment.employees || assignment.employees.length === 0) && (
              <span className="text-xs text-gray-500">{t('planner.noEmployees')}</span>
            )}
          </div>
        </div>
      </CardContent>
      
      {canManage && (
        <CardFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2">
          <AssignmentActionButtons
            assignment={assignment}
            onEdit={onEdit}
            onDelete={onDelete}
            onPublish={onPublish}
          />
        </CardFooter>
      )}
    </Card>
  );
};

export default AssignmentCard;
