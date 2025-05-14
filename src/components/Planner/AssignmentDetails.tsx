
import React from 'react';
import { Car, Clock, MapPin, Users } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';

interface AssignmentDetailsProps {
  assignment: Assignment;
}

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({ assignment }) => {
  const { t } = useTranslation();
  
  // Create a formatted time range string
  const timeRange = `${assignment.fromTime} - ${assignment.toTime}`;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
      {assignment.location && (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <span className="truncate">{assignment.location}</span>
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
