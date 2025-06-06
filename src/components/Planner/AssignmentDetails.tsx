
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, UserCheck, Users, Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '../../types/assignment';
import { Car as CarType } from '../../types/car';

interface AssignmentDetailsProps {
  assignment: Assignment;
  cars: CarType[];
}

const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({ assignment, cars }) => {
  const { t } = useTranslation();

  // Get car names for display using the cars prop - IMPROVED VERSION
  const getCarNames = (assignment: Assignment): string[] => {
    const carNames: string[] = [];
    
    console.log('[AssignmentDetails] Getting car names for assignment:', assignment.id);
    console.log('[AssignmentDetails] Assignment cars:', assignment.cars);
    console.log('[AssignmentDetails] Assignment car (legacy):', assignment.car);
    console.log('[AssignmentDetails] Available cars:', cars);
    
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      // New format: multiple cars array
      assignment.cars.forEach(carId => {
        console.log('[AssignmentDetails] Looking for car with ID:', carId);
        const car = cars.find(c => c.id === carId);
        if (car) {
          console.log('[AssignmentDetails] Found car:', car.name);
          carNames.push(car.name);
        } else {
          console.log('[AssignmentDetails] Car not found, using ID:', carId);
          carNames.push(carId); // Fallback to ID if car not found
        }
      });
    } else if (assignment.car) {
      // Old format: single car
      if (typeof assignment.car === 'string') {
        console.log('[AssignmentDetails] Legacy car ID:', assignment.car);
        const car = cars.find(c => c.id === assignment.car);
        carNames.push(car ? car.name : assignment.car);
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        console.log('[AssignmentDetails] Legacy car object:', assignment.car.name);
        carNames.push(assignment.car.name);
      }
    }
    
    console.log('[AssignmentDetails] Final car names:', carNames);
    return carNames;
  };

  const carNames = getCarNames(assignment);

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      {/* Left Column */}
      <div className="space-y-3">
        {/* Time */}
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{assignment.fromTime} - {assignment.toTime}</span>
        </div>

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
      </div>

      {/* Right Column */}
      <div className="space-y-3">
        {/* Responsible User */}
        {assignment.responsibleUser && (
          <div className="flex items-center gap-2 text-gray-600">
            <UserCheck className="h-4 w-4" />
            <span>{assignment.responsibleUser.name}</span>
          </div>
        )}

        {/* Employees */}
        {assignment.employees && assignment.employees.length > 0 && (
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-4 w-4" />
            <div className="flex flex-wrap gap-1">
              {assignment.employees.map((employee, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {employee}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetails;
