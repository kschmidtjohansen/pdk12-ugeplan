
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '../../types/assignment';

interface AssignmentDetailsProps {
  assignment: Assignment;
}

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({ assignment }) => {
  const { t } = useTranslation();

  // Get car names for display - handle both old and new format
  const getCarNames = (assignment: Assignment): string[] => {
    const carNames: string[] = [];
    
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      // New format: multiple cars array
      assignment.cars.forEach(carId => {
        // For now, just display the car ID since we don't have car names in this component
        // In a real implementation, you'd want to fetch car names from the cars hook
        carNames.push(carId);
      });
    } else if (assignment.car) {
      // Old format: single car
      if (typeof assignment.car === 'string') {
        carNames.push(assignment.car);
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        carNames.push(assignment.car.name);
      }
    }
    
    return carNames;
  };

  const carNames = getCarNames(assignment);

  return (
    <div className="space-y-3 text-sm">
      {/* Time */}
      <div className="flex items-center gap-2 text-gray-600">
        <Clock className="h-4 w-4" />
        <span>{assignment.fromTime} - {assignment.toTime}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-gray-600">
        <MapPin className="h-4 w-4" />
        <span>{assignment.location}</span>
      </div>

      {/* Responsible User */}
      {assignment.responsibleUser && (
        <div className="flex items-center gap-2 text-gray-600">
          <User className="h-4 w-4" />
          <span>{assignment.responsibleUser.name}</span>
        </div>
      )}

      {/* Cars */}
      {carNames.length > 0 && (
        <div className="flex items-center gap-2 text-gray-600">
          <Car className="h-4 w-4" />
          <div className="flex flex-wrap gap-1">
            {carNames.map((carName, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {carName}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Employees */}
      {assignment.employees && assignment.employees.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="h-4 w-4" />
            <span className="font-medium">{t('planner.employees')}:</span>
          </div>
          <div className="flex flex-wrap gap-1 ml-6">
            {assignment.employees.map((employee, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {employee}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetails;
