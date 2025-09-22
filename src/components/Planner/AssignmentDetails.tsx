import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, UserCheck, Users, Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment, getEmployeeNamesFromIds } from '../../types/assignment';
import { Car as CarType } from '../../types/car';
import { useEmployees } from '../../hooks/useEmployees';
interface AssignmentDetailsProps {
  assignment: Assignment;
  cars: CarType[];
  showFullTeamDetails?: boolean;
}
const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({
  assignment,
  cars,
  showFullTeamDetails = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { employees } = useEmployees();

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

  // Enhanced employee data processing with improved UUID detection and fallbacks
  const getEmployeeData = (assignment: Assignment): {
    names: string[];
    hasFullData: boolean;
  } => {
    console.log('[AssignmentDetails] Processing employee data for assignment:', assignment.title);
    console.log('[AssignmentDetails] Employee data available:', {
      hasAssignedEmployees: !!assignment.assignedEmployees?.length,
      assignedEmployees: assignment.assignedEmployees?.map(e => ({ id: e.id, name: e.name })),
      hasLegacyEmployees: !!assignment.employees?.length,
      legacyEmployees: assignment.employees
    });
    
    // Function to check if a string is a UUID
    const isUUID = (str: string) => {
      if (!str || typeof str !== 'string') return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };
    
    // PRIORITY 1: Use assignedEmployees with full employee data (preferred)
    if (assignment.assignedEmployees && assignment.assignedEmployees.length > 0) {
      const processedNames = assignment.assignedEmployees
        .map(emp => {
          // If the name is a UUID or "Unknown User", try to find the real name
          if (isUUID(emp.name) || emp.name === 'Unknown User') {
            const realEmployee = employees.find(e => e.id === emp.id);
            if (realEmployee && realEmployee.name && !isUUID(realEmployee.name)) {
              return realEmployee.name;
            }
            // Use email prefix if available
            if (emp.email && emp.email.includes('@')) {
              return emp.email.split('@')[0];
            }
            return 'Unknown User';
          }
          return emp.name;
        })
        .filter(name => name && name.trim() && name !== '' && name !== 'Unknown User')
        .filter((name, index, array) => array.indexOf(name) === index); // Remove duplicates
      
      console.log('[AssignmentDetails] Processed assignedEmployees names:', processedNames);
      
      return {
        names: processedNames,
        hasFullData: true
      };
    }

    // PRIORITY 2: Fallback to legacy employee IDs array - convert to names using employees hook
    if (assignment.employees && Array.isArray(assignment.employees) && assignment.employees.length > 0) {
      console.log('[AssignmentDetails] Falling back to legacy employees array, converting IDs to names');
      
      // Check if employees array contains names or IDs
      const firstEmployee = assignment.employees[0];
      
      if (isUUID(firstEmployee)) {
        // Convert UUIDs to names
        const names = getEmployeeNamesFromIds(assignment.employees, employees);
        console.log('[AssignmentDetails] Converted UUIDs to names:', names);
        
        return {
          names: names.filter(name => name && !isUUID(name) && name !== 'Unknown User'),
          hasFullData: false
        };
      } else {
        // Already names, filter out any invalid names
        const names = assignment.employees
          .filter(name => name && typeof name === 'string' && !isUUID(name) && name !== 'Unknown User')
          .filter((name, index, array) => array.indexOf(name) === index); // Remove duplicates
        console.log('[AssignmentDetails] Using legacy employee names directly:', names);
        
        return {
          names,
          hasFullData: false
        };
      }
    }
    
    console.log('[AssignmentDetails] No employee data available');
    return {
      names: [],
      hasFullData: false
    };
  };
  const employeeData = getEmployeeData(assignment);
  return <div className="grid grid-cols-2 gap-4 text-sm">
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
        {carNames.length > 0 && <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <Car className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex flex-wrap gap-1">
              {carNames.map((carName, index) => <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                  {carName}
                </Badge>)}
            </div>
          </div>}
      </div>

      {/* Right Column */}
      <div className="space-y-3">

        {/* Show all team members for assignments user can access */}
        {employeeData.names.length > 0 && <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200">
              <Users className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              
              <div className="flex flex-wrap gap-1">
                {employeeData.names.map((employeeName, index) => <Badge key={index} variant="secondary" className="text-xs bg-purple-50">
                    {employeeName || t('planner.unknownEmployee')}
                  </Badge>)}
              </div>
            </div>
          </div>}
      </div>
    </div>;
};
export default AssignmentDetails;