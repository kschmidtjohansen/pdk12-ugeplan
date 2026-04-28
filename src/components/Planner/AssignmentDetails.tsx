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
  return <div className="grid grid-cols-2 gap-4 text-sm">
      {/* Left Column */}
      <div className="space-y-3">
        {/* Time */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <span className="text-foreground font-medium text-sm tabular-nums px-2 py-0.5 rounded-md bg-primary/8 border border-primary/15">
            {assignment.fromTime ? assignment.fromTime.substring(0, 5) : '00:00'} – {assignment.toTime ? assignment.toTime.substring(0, 5) : '00:00'}
          </span>
        </div>

        {/* Cars */}
        {carData.length > 0 && <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
              <Car className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-wrap gap-1">
              <TooltipProvider delayDuration={100}>
                {carData.map((car) => (
                  <Tooltip key={car.id}>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs cursor-default font-medium border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30",
                          car.isShared && "border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-700/60"
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
        {employeeData.names.length > 0 && <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex flex-wrap gap-1">
                {employeeData.names.map((employeeName, index) => <Badge key={index} variant="outline" className="text-xs font-medium border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30">
                    {employeeName || t('planner.unknownEmployee')}
                  </Badge>)}
              </div>
            </div>
          </div>}
      </div>
    </div>;
};
export default AssignmentDetails;