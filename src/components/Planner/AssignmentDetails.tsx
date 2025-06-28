
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

  // COMPREHENSIVE CAR FIX: Handle both car object and car ID formats with fallbacks
  const getCarNames = (assignment: Assignment): string[] => {
    const carNames: string[] = [];
    
    console.log('[AssignmentDetails] COMPREHENSIVE CAR FIX - Getting car names for assignment:', assignment.id);
    console.log('[AssignmentDetails] COMPREHENSIVE CAR FIX - Assignment cars array:', assignment.cars);
    console.log('[AssignmentDetails] COMPREHENSIVE CAR FIX - Assignment car (legacy):', assignment.car);
    console.log('[AssignmentDetails] COMPREHENSIVE CAR FIX - Available cars for lookup:', cars.length);
    
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      // New format: multiple cars array with IDs
      assignment.cars.forEach(carId => {
        if (carId) {
          const car = cars.find(c => c.id === carId);
          if (car) {
            carNames.push(car.name);
          } else {
            // Fallback: use the ID if we can't find the car object, but make it more readable
            carNames.push(`Car ${carId.substring(0, 8)}`);
          }
        }
      });
    } else if (assignment.car) {
      // Old format: single car
      if (typeof assignment.car === 'string') {
        const car = cars.find(c => c.id === assignment.car);
        if (car) {
          carNames.push(car.name);
        } else {
          // Fallback: use the ID if we can't find the car object
          carNames.push(`Car ${assignment.car.substring(0, 8)}`);
        }
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        carNames.push(assignment.car.name);
      }
    }
    
    console.log('[AssignmentDetails] COMPREHENSIVE CAR FIX - Final car names:', carNames);
    return carNames;
  };

  const carNames = getCarNames(assignment);

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      {/* Left Column */}
      <div className="space-y-3">
        {/* Time - styled to match dashboard */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-green-50 border border-green-200">
            <Clock className="h-3.5 w-3.5 text-green-600" />
          </div>
          <span className="text-foreground font-medium text-sm">
            {assignment.fromTime ? assignment.fromTime.substring(0, 5) : '00:00'} - {assignment.toTime ? assignment.toTime.substring(0, 5) : '00:00'}
          </span>
        </div>

        {/* COMPREHENSIVE CAR FIX: Cars - improved display with better styling and fallbacks */}
        {carNames.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <Car className="h-3.5 w-3.5 text-blue-600" />
            </div>
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
        {/* Responsible User - styled to match dashboard with fallback */}
        {assignment.responsibleUser && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
              <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <span className="text-foreground font-medium text-sm">
              {assignment.responsibleUser.name || t('planner.noResponsibleUser')}
            </span>
          </div>
        )}

        {/* COMPREHENSIVE FIX: Employees - properly displayed with complete names and fallbacks */}
        {assignment.employees && assignment.employees.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200">
              <Users className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex flex-wrap gap-1">
              {assignment.employees.map((employee, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {employee || t('planner.unknownEmployee')}
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
