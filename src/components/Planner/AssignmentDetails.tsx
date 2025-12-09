import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, UserCheck, Users, Car, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment, getEmployeeNamesFromIds } from '../../types/assignment';
import { Car as CarType } from '../../types/car';
import { useEmployees } from '../../hooks/useEmployees';
import { filterDisplayNames } from '../../utils/people';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AssignmentDetailsProps {
  assignment: Assignment;
  cars: CarType[];
  assignments?: Assignment[];
  showFullTeamDetails?: boolean;
}
const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({
  assignment,
  cars,
  assignments = [],
  showFullTeamDetails = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { employees } = useEmployees();

  // Get car IDs from assignment
  const getCarIds = (assignment: Assignment): string[] => {
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      return assignment.cars.filter(Boolean);
    } else if (assignment.car) {
      if (typeof assignment.car === 'string') {
        return [assignment.car];
      } else if (typeof assignment.car === 'object' && assignment.car.id) {
        return [assignment.car.id];
      }
    }
    return [];
  };

  // Check if a car is shared with other assignments on the same day
  const getCarSharingInfo = (carId: string): { isShared: boolean; otherAssignments: string[] } => {
    if (!assignments.length) return { isShared: false, otherAssignments: [] };
    
    const otherAssignments = assignments.filter(a => {
      if (a.id === assignment.id) return false;
      if (a.date !== assignment.date) return false;
      
      const assignmentCarIds = getCarIds(a);
      return assignmentCarIds.includes(carId);
    });
    
    return {
      isShared: otherAssignments.length > 0,
      otherAssignments: otherAssignments.map(a => a.title || a.case_number || t('planner.assignment'))
    };
  };

  // Enhanced car data resolution with sharing info
  const getCarData = (assignment: Assignment): { id: string; name: string; isShared: boolean; sharedWith: string[] }[] => {
    const carData: { id: string; name: string; isShared: boolean; sharedWith: string[] }[] = [];
    const carIds = getCarIds(assignment);
    
    carIds.forEach(carId => {
      const car = cars.find(c => c.id === carId);
      if (car) {
        const sharingInfo = getCarSharingInfo(carId);
        carData.push({
          id: carId,
          name: car.name,
          isShared: sharingInfo.isShared,
          sharedWith: sharingInfo.otherAssignments
        });
      }
    });
    
    return carData;
  };
  
  const carData = getCarData(assignment);

  // Check if an employee is shared with other assignments on the same day
  const getEmployeeSharingInfo = (employeeId: string, employeeName: string): { isShared: boolean; otherAssignments: string[] } => {
    if (!assignments.length) return { isShared: false, otherAssignments: [] };
    
    const otherAssignments = assignments.filter(a => {
      if (a.id === assignment.id) return false;
      if (a.date !== assignment.date) return false;
      
      // Check if employee is assigned to this assignment
      const assignedIds = a.assignedEmployees?.map(e => e.id) || [];
      const assignedNames = a.employees || [];
      return assignedIds.includes(employeeId) || assignedNames.includes(employeeName);
    });
    
    return {
      isShared: otherAssignments.length > 0,
      otherAssignments: otherAssignments.map(a => a.title || a.case_number || t('planner.assignment'))
    };
  };

  // Enhanced employee data processing with sharing info
  const getEmployeeData = (assignment: Assignment): {
    id: string;
    name: string;
    isShared: boolean;
    sharedWith: string[];
  }[] => {
    const employeeData: { id: string; name: string; isShared: boolean; sharedWith: string[] }[] = [];
    
    // Add from assignedEmployees (new format)
    if (assignment.assignedEmployees?.length) {
      assignment.assignedEmployees.forEach(emp => {
        const name = emp.name || emp.email || '';
        if (name) {
          const sharingInfo = getEmployeeSharingInfo(emp.id, name);
          employeeData.push({
            id: emp.id,
            name,
            isShared: sharingInfo.isShared,
            sharedWith: sharingInfo.otherAssignments
          });
        }
      });
    }
    
    // Add from legacy employees array (filter out UUIDs and duplicates)
    if (assignment.employees?.length) {
      const processedNames = filterDisplayNames(assignment.employees);
      processedNames.forEach(name => {
        // Skip if already added from assignedEmployees
        if (!employeeData.some(e => e.name === name)) {
          const sharingInfo = getEmployeeSharingInfo('', name);
          employeeData.push({
            id: '',
            name,
            isShared: sharingInfo.isShared,
            sharedWith: sharingInfo.otherAssignments
          });
        }
      });
    }
    
    return employeeData;
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

        {/* Cars - enhanced display with sharing indicators */}
        {carData.length > 0 && <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <Car className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex flex-wrap gap-1">
              <TooltipProvider delayDuration={100}>
                {carData.map((car) => (
                  <Tooltip key={car.id}>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs cursor-default",
                          car.isShared 
                            ? "bg-yellow-50 border-yellow-300 text-yellow-700" 
                            : "bg-blue-50"
                        )}
                      >
                        {car.name}
                        {car.isShared && <AlertTriangle className="h-3 w-3 ml-1" />}
                      </Badge>
                    </TooltipTrigger>
                    {car.isShared && (
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-medium">{t('planner.sharedWithOtherTasks')}</p>
                        <p className="text-xs text-muted-foreground">{car.sharedWith.join(', ')}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>}
      </div>

      {/* Right Column */}
      <div className="space-y-3">

        {/* Show all team members for assignments user can access */}
        {employeeData.length > 0 && <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200">
              <Users className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex flex-wrap gap-1">
                <TooltipProvider delayDuration={100}>
                  {employeeData.map((emp, index) => (
                    <Tooltip key={emp.id || index}>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs cursor-default",
                            emp.isShared 
                              ? "bg-yellow-50 border-yellow-300 text-yellow-700 border" 
                              : "bg-purple-50"
                          )}
                        >
                          {emp.name || t('planner.unknownEmployee')}
                          {emp.isShared && <AlertTriangle className="h-3 w-3 ml-1" />}
                        </Badge>
                      </TooltipTrigger>
                      {emp.isShared && (
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="font-medium">{t('planner.sharedWithOtherTasks')}</p>
                          <p className="text-xs text-muted-foreground">{emp.sharedWith.join(', ')}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </div>
          </div>}
      </div>
    </div>;
};
export default AssignmentDetails;