
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

  // FIXED: Get car names for display - now properly using the fetched car data
  const getCarNames = (assignment: Assignment): string[] => {
    const carNames: string[] = [];
    
    console.log('[AssignmentDetails] FIXED - Getting car names for assignment:', assignment.id);
    console.log('[AssignmentDetails] FIXED - Assignment cars array:', assignment.cars);
    console.log('[AssignmentDetails] FIXED - Assignment car (legacy):', assignment.car);
    console.log('[AssignmentDetails] FIXED - Available cars prop:', cars);
    
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      // New format: multiple cars array
      assignment.cars.forEach(carId => {
        console.log('[AssignmentDetails] FIXED - Looking for car with ID:', carId);
        const car = cars.find(c => c.id === carId);
        if (car) {
          console.log('[AssignmentDetails] FIXED - Found car:', car.name);
          carNames.push(car.name);
        } else {
          console.log('[AssignmentDetails] FIXED - Car not found in props, checking assignment car object');
          // If the assignment has car data directly (from the optimized fetch)
          if (assignment.car && typeof assignment.car === 'object' && assignment.car.id === carId) {
            carNames.push(assignment.car.name);
          } else {
            console.log('[AssignmentDetails] FIXED - Car not found, using ID as fallback:', carId);
            carNames.push(carId); // Fallback to ID if car not found
          }
        }
      });
    } else if (assignment.car) {
      // Old format: single car
      if (typeof assignment.car === 'string') {
        console.log('[AssignmentDetails] FIXED - Legacy car ID:', assignment.car);
        const car = cars.find(c => c.id === assignment.car);
        carNames.push(car ? car.name : assignment.car);
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        console.log('[AssignmentDetails] FIXED - Legacy car object:', assignment.car.name);
        carNames.push(assignment.car.name);
      }
    }
    
    console.log('[AssignmentDetails] FIXED - Final car names:', carNames);
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
            {assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}
          </span>
        </div>

        {/* Cars - styled to match dashboard with improved display */}
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
        {/* Responsible User - styled to match dashboard */}
        {assignment.responsibleUser && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
              <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <span className="text-foreground font-medium text-sm">
              {assignment.responsibleUser.name}
            </span>
          </div>
        )}

        {/* Employees - styled to match dashboard with improved display */}
        {assignment.employees && assignment.employees.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200">
              <Users className="h-3.5 w-3.5 text-purple-600" />
            </div>
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
