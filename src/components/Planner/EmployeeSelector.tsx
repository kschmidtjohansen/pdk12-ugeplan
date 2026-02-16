import React, { useEffect, useMemo, useState } from 'react';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Users, MapPin } from 'lucide-react';
import { getEmployeeAvailabilityStatus, getEmployeeVacationStatus } from '@/utils/employeeAvailability';
import { shouldRemoveEmployeeFromAssignment } from '@/utils/employeeAssignmentUtils';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployees: string[];
  onToggle: (employeeId: string) => void;
  vacations: Vacation[];
  currentDate: string;
  assignments?: Assignment[];
  casePostcode?: string;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployees,
  onToggle,
  vacations,
  currentDate,
  assignments = [],
  casePostcode
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [autoRemovedEmployees, setAutoRemovedEmployees] = useState<string[]>([]);

  const getProximityLevel = (emp: Employee, postcode: string): number => {
    if (!emp.home_postcode) return 3;
    if (emp.home_postcode === postcode) return 0;
    if (emp.home_postcode.substring(0, 2) === postcode.substring(0, 2)) return 1;
    return 2;
  };

  const sortedEmployees = useMemo(() => {
    if (!casePostcode || casePostcode.length !== 4) {
      return [...employees].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...employees].sort((a, b) => {
      const diff = getProximityLevel(a, casePostcode) - getProximityLevel(b, casePostcode);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
  }, [employees, casePostcode]);

  const dateForComparison = (() => {
    try {
      let dateStr: string;
      if (currentDate.includes('/')) {
        const [day, month, year] = currentDate.split('/');
        dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (currentDate.includes('T')) {
        dateStr = currentDate.split('T')[0];
      } else {
        dateStr = currentDate;
      }
      return new Date(dateStr + 'T12:00:00');
    } catch (e) {
      console.error('Error parsing date for vacation check:', e);
      return new Date();
    }
  })();

  useEffect(() => {
    const employeesToRemove: string[] = [];
    
    selectedEmployees.forEach(employeeId => {
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee && shouldRemoveEmployeeFromAssignment(employee, currentDate, vacations)) {
        employeesToRemove.push(employeeId);
      }
    });

    if (employeesToRemove.length > 0) {
      if (import.meta.env.DEV) {
        console.log('[EmployeeSelector] Auto-removing unavailable employees:', employeesToRemove);
      }
      setAutoRemovedEmployees(employeesToRemove.map(id => 
        employees.find(emp => emp.id === id)?.name || id
      ));
      
      employeesToRemove.forEach(employeeId => {
        onToggle(employeeId);
      });
    }
  }, [employees, vacations, currentDate, selectedEmployees, onToggle]);
  
  const getDisplayText = () => {
    if (selectedEmployees.length === 0) {
      return t('planner.selectEmployees');
    }
    if (selectedEmployees.length === 1) {
      const employee = employees.find(emp => emp.id === selectedEmployees[0]);
      return employee?.name || selectedEmployees[0];
    }
    return `${selectedEmployees.length} ${t('employees.selected')}`;
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("EmployeeSelector - Current date:", currentDate);
      console.log("EmployeeSelector - Selected employees:", selectedEmployees);
      console.log("EmployeeSelector - User role:", user?.role);
      console.log("EmployeeSelector - Sorted employees count:", sortedEmployees.length);
      console.log("EmployeeSelector - All assignments:", assignments);
      console.log("EmployeeSelector - Date for comparison:", dateForComparison);
      console.log("EmployeeSelector - Auto-removed employees:", autoRemovedEmployees);
    }
  }, [currentDate, selectedEmployees, assignments, user?.role, sortedEmployees.length, dateForComparison, autoRemovedEmployees]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('planner.employees')}</label>
      
      {autoRemovedEmployees.length > 0 && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          {t('employees.autoRemovedUnavailable')}: {autoRemovedEmployees.join(', ')}
        </div>
      )}
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-11 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="truncate">{getDisplayText()}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[300px] max-h-60 overflow-y-auto z-50 bg-popover border shadow-md">
          {sortedEmployees.map(employee => {
            try {
              if (!employee || !employee.id || !employee.name) {
                console.error('[EmployeeSelector] Invalid employee object:', employee);
                return null;
              }

              const isSelected = selectedEmployees.includes(employee.id);
              
              const isExpired = employee.is_temporary && employee.expires_at 
                ? new Date(employee.expires_at) < new Date() 
                : false;
              
              let vacationStatus;
              try {
                vacationStatus = getEmployeeVacationStatus(employee.id, dateForComparison, vacations);
              } catch (err) {
                console.error(`[EmployeeSelector] Error getting vacation status for ${employee.name}:`, err);
                vacationStatus = { isOnVacation: false, vacationType: 'none' };
              }
              
              const isManuallyOnLeave = employee.onLeave || false;
              
              let availabilityInfo;
              try {
                availabilityInfo = getEmployeeAvailabilityStatus(employee, dateForComparison, assignments, vacations, t);
              } catch (err) {
                console.error(`[EmployeeSelector] Error getting availability status for ${employee.name}:`, err);
                availabilityInfo = { status: 'available', statusText: '', badgeColor: '' };
              }
              
              const isDisabled = (vacationStatus.isOnVacation && vacationStatus.vacationType === 'full_day') 
                || isManuallyOnLeave 
                || isExpired
                || employee.status === 'terminated'
                || employee.status === 'inactive';
              
              const hasRedStyling = availabilityInfo.status === 'fullyBooked';
              if (import.meta.env.DEV) {
                console.log(`[EmployeeSelector] Employee ${employee.name} red styling: ${hasRedStyling}, disabled: ${isDisabled}`);
              }
              
              return (
              <DropdownMenuItem
                key={employee.id}
                className={`flex items-center space-x-2 p-2 ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${hasRedStyling ? '!bg-red-50 !border-l-4 !border-red-600 hover:!bg-red-100' : ''}`}
                onSelect={(e) => {
                  e.preventDefault();
                  if (!isDisabled) {
                    onToggle(employee.id);
                  }
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => !isDisabled && onToggle(employee.id)}
                  disabled={isDisabled}
                  className="mr-2"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className={`font-medium ${hasRedStyling ? '!text-red-700 !font-bold' : ''}`}>
                        {employee.name}
                      </span>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      {casePostcode?.length === 4 && employee.home_postcode && (() => {
                        const pl = getProximityLevel(employee, casePostcode);
                        if (pl === 0) return (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
                            <MapPin className="h-3 w-3 mr-1" />
                            {t('planner.proximityExact')}
                          </Badge>
                        );
                        if (pl === 1) return (
                          <Badge className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                            {t('planner.proximityAlternative')}
                          </Badge>
                        );
                        return null;
                      })()}
                      {isExpired && (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      )}
                      {(employee.status === 'terminated' || employee.status === 'inactive') && (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                          {employee.status === 'terminated' ? 'Terminated' : 'Inactive'}
                        </Badge>
                      )}
                      {vacationStatus.isOnVacation && vacationStatus.vacationType === 'full_day' && (
                        <Badge variant="outline" className="text-xs">
                          {t('planner.onVacation')}
                        </Badge>
                      )}
                      {vacationStatus.isOnVacation && vacationStatus.vacationType === 'partial_day' && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          {availabilityInfo.statusText}
                        </Badge>
                      )}
                      {isManuallyOnLeave && (
                        <Badge variant="outline" className="text-xs">
                          {t('employees.onLeave')}
                        </Badge>
                      )}
                      {availabilityInfo.status !== 'available' && !vacationStatus.isOnVacation && !isDisabled && (
                        <Badge className={`text-xs font-medium ${availabilityInfo.badgeColor}`}>
                          {availabilityInfo.statusText}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            );
            } catch (err) {
              console.error(`[EmployeeSelector] Error rendering employee ${employee?.name || 'unknown'}:`, err);
              return null;
            }
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EmployeeSelector;
