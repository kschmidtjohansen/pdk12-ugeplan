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

  // Enhanced employee data processing with improved UUID detection and fallbacks
  const getEmployeeData = (assignment: Assignment): {
    names: string[];
    hasFullData: boolean;
  } => {
    if (import.meta.env.DEV) {
      console.log('[AssignmentDetails] Processing employee data for assignment:', assignment.title);
      if (import.meta.env.DEV) console.log('[AssignmentDetails] Employee data available:', {
        hasAssignedEmployees: !!assignment.assignedEmployees?.length,
        assignedEmployees: assignment.assignedEmployees?.map(e => ({ id: e.id, name: e.name })),
        hasLegacyEmployees: !!assignment.employees?.length,
        legacyEmployees: assignment.employees
      });
    }
    
    const names: string[] = [];
    
    // Add names from assignedEmployees (new format)
    if (assignment.assignedEmployees?.length) {
      names.push(...assignment.assignedEmployees.map(emp => emp.name || emp.email || ''));
    }
    
    // Add names from legacy employees array
    if (assignment.employees?.length) {
      names.push(...assignment.employees);
    }
    
    // Use the filterDisplayNames utility to remove UUIDs and duplicates
    const processedNames = filterDisplayNames(names);
    
    if (import.meta.env.DEV) console.log('[AssignmentDetails] Processed names:', processedNames);
    
    return {
      names: processedNames,
      hasFullData: !!assignment.assignedEmployees?.length
    };
  };
  const employeeData = getEmployeeData(assignment);
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
      {/* Left Column */}
      <div className="space-y-2.5">
        {/* Time */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 chip-glass-primary px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums">
            <Clock className="h-3.5 w-3.5" />
            {assignment.fromTime ? assignment.fromTime.substring(0, 5) : '00:00'} – {assignment.toTime ? assignment.toTime.substring(0, 5) : '00:00'}
          </span>
        </div>

        {/* Cars */}
        {carData.length > 0 && <div className="flex items-start gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center chip-glass-amber rounded-md h-6 w-6">
              <Car className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-wrap gap-1">
              <TooltipProvider delayDuration={100}>
                {carData.map((car) => (
                  <Tooltip key={car.id}>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md cursor-default chip-glass-amber",
                          car.isShared && "chip-glass-destructive"
                        )}
                      >
                        {car.name}
                        {car.isShared && <AlertTriangle className="h-3 w-3" />}
                      </span>
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
      <div className="space-y-2.5">
        {employeeData.names.length > 0 && <div className="flex items-start gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center chip-glass-emerald rounded-md h-6 w-6">
              <Users className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-wrap gap-1 min-w-0 flex-1">
              {employeeData.names.map((employeeName, index) => <span key={index} className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md chip-glass-emerald">
                  {employeeName || t('planner.unknownEmployee')}
                </span>)}
            </div>
          </div>}
      </div>
    </div>;
};
export default AssignmentDetails;