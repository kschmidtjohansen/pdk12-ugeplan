
import React from 'react';
import { Car, Clock, Tag, Users } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';

interface AssignmentDetailsProps {
  assignment: Assignment;
}

// Helper function to format time to HH:MM format (remove seconds)
const formatTime = (time: string): string => {
  if (!time) return '';
  // If time already has the format HH:MM, return as is
  if (time.length === 5) return time;
  // Otherwise, assume HH:MM:SS format and remove seconds
  return time.substring(0, 5);
};

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({ assignment }) => {
  const { t } = useTranslation();
  
  // Create a formatted time range string without seconds
  const timeRange = `${formatTime(assignment.fromTime)} - ${formatTime(assignment.toTime)}`;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
      {assignment.title && (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <span className="truncate">{assignment.title}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 flex-shrink-0 text-gray-500" />
        <span>{timeRange}</span>
      </div>
      
      {assignment.car && (
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <span className="truncate">
            {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
          </span>
        </div>
      )}
      
      <div className="flex items-start gap-2">
        <Users className="w-4 h-4 flex-shrink-0 text-gray-500 mt-0.5" />
        <span>
          {assignment.employees && assignment.employees.length > 0
            ? assignment.employees.join(', ')
            : t('planner.noEmployees')}
        </span>
      </div>
    </div>
  );
};

export default AssignmentDetails;
