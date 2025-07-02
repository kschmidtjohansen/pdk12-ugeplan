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

  console.log('[AssignmentDetails] COMPREHENSIVE FIX - Assignment:', assignment.id);
  console.log('[AssignmentDetails] COMPREHENSIVE FIX - Responsible user details:', {
    hasResponsibleUser: !!assignment.responsibleUser,
    responsibleUserName: assignment.responsibleUser?.name,
    responsibleUserId: assignment.responsibleUser?.id,
    fullResponsibleUserObject: assignment.responsibleUser
  });

  // Enhanced car name resolution with comprehensive fallbacks
  const getCarNames = (assignment: Assignment): string[] => {
    const carNames: string[] = [];
    
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      // New format: multiple cars array with IDs
      assignment.cars.forEach(carId => {
        if (carId) {
          const car = cars.find(c => c.id === carId);
          if (car) {
            carNames.push(car.name);
          } else {
            // Enhanced fallback: use the ID if we can't find the car object
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
          // Enhanced fallback for string car ID
          carNames.push(`Car ${assignment.car.substring(0, 8)}`);
        }
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        carNames.push(assignment.car.name);
      }
    }
    
    return carNames;
  };

  const carNames = getCarNames(assignment);

  // Enhanced employee name resolution
  const getEmployeeNames = (assignment: Assignment): string[] => {
    if (!assignment.employees || !Array.isArray(assignment.employees)) {
      return [];
    }
    
    return assignment.employees
      .filter(employee => employee && typeof employee === 'string')
      .map(employee => employee.trim())
      .filter(employee => employee.length > 0);
  };

  const employeeNames = getEmployeeNames(assignment);

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      {/* Left Column */}
      <div className="space-y-3">
        {/* Time - enhanced styling */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-green-50 border border-green-200">
            <Clock className="h-3.5 w-3.5 text-green-600" />
          </div>
          <span className="text-foreground font-medium text-sm">
            {assignment.fromTime ? assignment.fromTime.substring(0, 5) : '00:00'} - {assignment.toTime ? assignment.toTime.substring(0, 5) : '00:00'}
          </span>
        </div>

        {/* Cars - enhanced display with comprehensive fallbacks */}
        {carNames.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <Car className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex flex-wrap gap-1">
              {carNames.map((carName, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                  {carName}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="space-y-3">
        {/* COMPREHENSIVE FIX: Enhanced Sagsansvarlig display with better validation and fallbacks */}
        {assignment.responsibleUser?.name && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
              <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-muted-foreground font-medium">
                {t('planner.responsibleUser') || 'Sagsansvarlig'}
              </span>
              <span className="text-foreground font-medium text-sm truncate" title={assignment.responsibleUser.name}>
                {assignment.responsibleUser.name}
              </span>
            </div>
          </div>
        )}

        {/* Employees - enhanced with comprehensive name handling */}
        {employeeNames.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200">
              <Users className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex flex-wrap gap-1">
              {employeeNames.map((employeeName, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-purple-50">
                  {employeeName || (t('planner.unknownEmployee') || 'Ukendt medarbejder')}
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
