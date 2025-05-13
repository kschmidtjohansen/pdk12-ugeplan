
import React from 'react';
import { Clock, MapPin, Car, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Assignment } from '../../types/assignment';
import { useTranslation } from '@/context/TranslationContext';

interface AssignmentDetailsProps {
  assignment: Assignment;
}

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({
  assignment
}) => {
  const { t } = useTranslation();
  
  // Format car display value
  const getCarDisplay = () => {
    if (!assignment.car) return t('planner.noCar');
    if (typeof assignment.car === 'string') return assignment.car;
    return assignment.car.name;
  };
  
  // Format times without seconds
  const formatTimeWithoutSeconds = (timeString: string) => {
    if (!timeString) return '';
    // If the time includes seconds (HH:MM:SS), remove them
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
    }
    return timeString;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-polygon-blue" />
        <span>
          {formatTimeWithoutSeconds(assignment.fromTime)} - {formatTimeWithoutSeconds(assignment.toTime)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-polygon-blue" />
        <span>{assignment.location}</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-polygon-blue" />
        <div className="flex flex-wrap gap-1">
          {assignment.employees && assignment.employees.length > 0 ? (
            assignment.employees.map((employee, index) => (
              <div key={index}>
                <Badge variant="outline" className="bg-gray-100">
                  {employee}
                </Badge>
                {index < assignment.employees.length - 1 && ', '}
              </div>
            ))
          ) : (
            <span>{t('planner.noEmployees')}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Car className="h-4 w-4 text-polygon-blue" />
        <span>{getCarDisplay()}</span>
      </div>
    </div>
  );
};

export default AssignmentDetails;
