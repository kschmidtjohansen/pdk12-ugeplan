import React, { useEffect, useMemo, useState } from 'react';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Users, MapPin } from 'lucide-react';
import { getEmployeeAvailabilityStatus, getEmployeeVacationStatus } from '@/utils/employeeAvailability';
import { shouldRemoveEmployeeFromAssignment } from '@/utils/employeeAssignmentUtils';
import { haversineDistanceKm } from '@/utils/haversine';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployees: string[];
  onToggle: (employeeId: string) => void;
  vacations: Vacation[];
  currentDate: string;
  assignments?: Assignment[];
  casePostcode?: string;
  caseLat?: number;
  caseLng?: number;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  employees,
  selectedEmployees,
  onToggle,
  vacations,
  currentDate,
  assignments = [],
  casePostcode,
  caseLat,
  caseLng
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const [autoRemovedEmployees, setAutoRemovedEmployees] = useState<string[]>([]);

  // Calculate distances from case to each employee using Haversine
  const distanceMap = useMemo(() => {
    const map = new Map<string, number>();
    if (caseLat == null || caseLng == null) return map;
    for (const emp of employees) {
      if (emp.lat != null && emp.lng != null) {
        map.set(emp.id, haversineDistanceKm(caseLat, caseLng, emp.lat, emp.lng));
      }
    }
    return map;
  }, [employees, caseLat, caseLng]);

  const sortedEmployees = useMemo(() => {
    if (caseLat != null && caseLng != null && distanceMap.size > 0) {
      return [...employees].sort((a, b) => {
        const distA = distanceMap.get(a.id);
        const distB = distanceMap.get(b.id);
        const aClose = distA != null && distA <= 15;
        const bClose = distB != null && distB <= 15;
        if (aClose && bClose) return distA! - distB!;
        if (aClose) return -1;
        if (bClose) return 1;
        return a.name.localeCompare(b.name);
      });
    }
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, caseLat, caseLng, distanceMap]);

  // Identify top-3 nearest employees within 15 km
  const top3NearbyIds = useMemo(() => {
    return sortedEmployees
      .filter(emp => {
        const d = distanceMap.get(emp.id);
        return d != null && d <= 15;
      })
      .slice(0, 3)
      .map(emp => emp.id);
  }, [sortedEmployees, distanceMap]);

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
      if (import.meta.env.DEV) console.error('Error parsing date for vacation check:', e);
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
      
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-11 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="truncate">{getDisplayText()}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 z-[60] bg-popover border shadow-lg" 
          sideOffset={4}
          onPointerDownOutside={(event) => {
            const target = event.target as Element;
            if (target.closest('[data-radix-popper-content-wrapper]')) {
              event.preventDefault();
            }
          }}
        >
          <div 
            className="max-h-64 overflow-y-auto overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {sortedEmployees.map((employee, index) => {
                try {
                  if (!employee || !employee.id || !employee.name) {
                    if (import.meta.env.DEV) console.error('[EmployeeSelector] Invalid employee object:', employee);
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
                    if (import.meta.env.DEV) console.error(`[EmployeeSelector] Error getting vacation status for ${employee.name}:`, err);
                    vacationStatus = { isOnVacation: false, vacationType: 'none' };
                  }
                  
                  const isManuallyOnLeave = employee.onLeave || false;
                  
                  let availabilityInfo;
                  try {
                    availabilityInfo = getEmployeeAvailabilityStatus(employee, dateForComparison, assignments, vacations, t);
                  } catch (err) {
                    if (import.meta.env.DEV) console.error(`[EmployeeSelector] Error getting availability status for ${employee.name}:`, err);
                    availabilityInfo = { status: 'available', statusText: '', badgeColor: '' };
                  }
                  
                  const isDisabled = (vacationStatus.isOnVacation && vacationStatus.vacationType === 'full_day') 
                    || isManuallyOnLeave 
                    || isExpired
                    || employee.status === 'terminated'
                    || employee.status === 'inactive';
                  
                  const isFullyBooked = availabilityInfo.status === 'fullyBooked';

                  // Distance info
                  const dist = distanceMap.get(employee.id);
                  const isNearby = dist != null && dist <= 15;
                  const isTop3 = top3NearbyIds.includes(employee.id);
                  const formattedDist = dist != null
                    ? (currentLanguage === 'da' ? dist.toFixed(1).replace('.', ',') : dist.toFixed(1))
                    : null;
                  
                  return (
                    <div
                      key={employee.id}
                      className={`flex items-center gap-3 py-3 px-4 transition-colors ${
                        index < sortedEmployees.length - 1 ? 'border-b border-border/40' : ''
                      } ${
                        isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'
                      } ${
                        isSelected ? 'bg-accent/30' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDisabled) {
                          onToggle(employee.id);
                        }
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        className="pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-foreground truncate">
                              {employee.name}
                            </span>
                            {isNearby && formattedDist && (
                              <span className={`text-xs flex items-center gap-1 mt-0.5 ${isTop3 ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                <MapPin className={`h-3 w-3 ${isTop3 ? 'text-green-600' : ''}`} />
                                {formattedDist} km {currentLanguage === 'da' ? 'væk' : 'away'}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2 flex-shrink-0">
                            {isExpired && (
                              <Badge variant="destructive" size="sm">
                                {t('employees.statusExpired')}
                              </Badge>
                            )}
                            {(employee.status === 'terminated' || employee.status === 'inactive') && (
                              <Badge variant="outline" size="sm" className="text-destructive border-destructive/30">
                                {employee.status === 'terminated' ? t('employees.statusTerminated') : t('employees.statusInactive')}
                              </Badge>
                            )}
                            {vacationStatus.isOnVacation && vacationStatus.vacationType === 'partial_day' && (
                              <Badge variant="warning" size="sm">
                                {availabilityInfo.statusText}
                              </Badge>
                            )}
                            {isFullyBooked && !isDisabled && (
                              <Badge variant="destructive" size="sm">
                                {availabilityInfo.statusText}
                              </Badge>
                            )}
                            {availabilityInfo.status !== 'available' && !isFullyBooked && !vacationStatus.isOnVacation && !isDisabled && (
                              <Badge variant="warning" size="sm">
                                {availabilityInfo.statusText}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } catch (err) {
                  if (import.meta.env.DEV) console.error(`[EmployeeSelector] Error rendering employee ${employee?.name || 'unknown'}:`, err);
                  return null;
                }
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EmployeeSelector;
