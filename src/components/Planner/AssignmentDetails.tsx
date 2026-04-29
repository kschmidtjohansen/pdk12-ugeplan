import React from 'react';
import { Clock, Users, Car, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '../../types/assignment';
import { Car as CarType } from '../../types/car';
import { useEmployees } from '../../hooks/useEmployees';
import { filterDisplayNames } from '../../utils/people';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const employeeCount = employeeData.names.length;
  const showInline = employeeCount > 0 && employeeCount <= 2;

  return (
    <div className="flex flex-col gap-2 text-sm">
      {/* Row 1: time (left) + people (right) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="icon-bubble icon-bubble-time" aria-hidden>
            <Clock className="h-3.5 w-3.5" />
          </span>
          <span className="chip chip-time chip-tabular chip-strong">
            {assignment.fromTime ? assignment.fromTime.substring(0, 5) : '00:00'}
            {' - '}
            {assignment.toTime ? assignment.toTime.substring(0, 5) : '00:00'}
          </span>
        </div>

        {employeeCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="icon-bubble icon-bubble-person" aria-hidden>
              <Users className="h-3.5 w-3.5" />
            </span>
            {showInline ? (
              employeeData.names.map((name, i) => (
                <span key={i} className="chip chip-person">
                  {name || t('planner.unknownEmployee')}
                </span>
              ))
            ) : (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="chip chip-person hover:opacity-80 transition-opacity cursor-help"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {employeeCount} {t('planner.employees') || 'medarbejdere'}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="end"
                    className="w-auto max-w-xs p-2"
                  >
                    <ul className="space-y-1">
                      {employeeData.names.map((name, i) => (
                        <li key={i} className="text-xs text-foreground flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {name || t('planner.unknownEmployee')}
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>

      {/* Row 2: cars */}
      {carData.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="icon-bubble icon-bubble-car" aria-hidden>
            <Car className="h-3.5 w-3.5" />
          </span>
          <TooltipProvider delayDuration={100}>
            {carData.map((car) => (
              <Tooltip key={car.id}>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'chip chip-car',
                      car.isShared && 'ring-1 ring-destructive/40 text-destructive'
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
      )}
    </div>
  );
};
export default AssignmentDetails;