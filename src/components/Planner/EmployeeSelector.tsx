import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, MapPin, Search } from 'lucide-react';

import { getEmployeeAvailabilityStatus, getEmployeeVacationStatus } from '@/utils/employeeAvailability';
import { shouldRemoveEmployeeFromAssignment } from '@/utils/employeeAssignmentUtils';
import { haversineDistanceKm } from '@/utils/haversine';
import { useIsMobile } from '@/hooks/use-mobile';
import { getRoleBadgeClass } from '@/utils/roleColors';
import { useActiveTrainingsForDate } from '@/hooks/useActiveTrainings';

type MultiDateAvailability = 'full' | 'partial' | 'none';

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
  allSelectedDates?: Date[];
  employeesLoading?: boolean;
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
  caseLng,
  allSelectedDates = [],
  employeesLoading = false
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [autoRemovedEmployees, setAutoRemovedEmployees] = useState<string[]>([]);
  const { trainingIds: trainingIdsForDate } = useActiveTrainingsForDate(currentDate);

  // Haversine sort — deps: employee list + assignment GPS coords
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

  // Role priority: servicemedarbejdere always first
  const rolePriority = (emp: Employee): number => {
    const isService = emp.role === 'servicemedarbejder' || emp.roles?.includes('servicemedarbejder');
    return isService ? 0 : 1;
  };

  // Role-first sort, then Haversine distance within each role group
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => {
      const prioA = rolePriority(a);
      const prioB = rolePriority(b);
      if (prioA !== prioB) return prioA - prioB;

      const distA = distanceMap.get(a.id);
      const distB = distanceMap.get(b.id);
      const aClose = distA != null && distA <= 15;
      const bClose = distB != null && distB <= 15;
      if (aClose && bClose) return distA! - distB!;
      if (aClose) return -1;
      if (bClose) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [employees, distanceMap]);

  const top3NearbyIds = useMemo(() => {
    return sortedEmployees
      .filter(emp => {
        const d = distanceMap.get(emp.id);
        return d != null && d <= 15;
      })
      .slice(0, 3)
      .map(emp => emp.id);
  }, [sortedEmployees, distanceMap]);
  // Compute per-employee availability across all selected dates
  const multiDateAvailability = useMemo(() => {
    const map = new Map<string, MultiDateAvailability>();
    if (allSelectedDates.length === 0) return map;

    for (const emp of employees) {
      let unavailableCount = 0;
      for (const date of allSelectedDates) {
        try {
          const vacStatus = getEmployeeVacationStatus(emp.id, date, vacations);
          if (vacStatus.isOnVacation && vacStatus.vacationType === 'full_day') {
            unavailableCount++;
            continue;
          }
          if (emp.onLeave || emp.status === 'terminated' || emp.status === 'inactive') {
            unavailableCount++;
            continue;
          }
          if (emp.is_temporary && emp.expires_at && new Date(emp.expires_at) < new Date()) {
            unavailableCount++;
            continue;
          }
          const avail = getEmployeeAvailabilityStatus(emp, date, assignments, vacations, t);
          if (avail.status === 'fullyBooked') {
            unavailableCount++;
          }
        } catch {
          // treat errors as available
        }
      }

      if (unavailableCount === 0) {
        map.set(emp.id, 'full');
      } else if (unavailableCount >= allSelectedDates.length) {
        map.set(emp.id, 'none');
      } else {
        map.set(emp.id, 'partial');
      }
    }
    return map;
  }, [employees, allSelectedDates, vacations, assignments, t]);

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
      if (import.meta.env.DEV) console.log("EmployeeSelector - Selected employees:", selectedEmployees);
      if (import.meta.env.DEV) console.log("EmployeeSelector - User role:", user?.role);
      if (import.meta.env.DEV) console.log("EmployeeSelector - Sorted employees count:", sortedEmployees.length);
      if (import.meta.env.DEV) console.log("EmployeeSelector - All assignments:", assignments);
      if (import.meta.env.DEV) console.log("EmployeeSelector - Date for comparison:", dateForComparison);
      if (import.meta.env.DEV) console.log("EmployeeSelector - Auto-removed employees:", autoRemovedEmployees);
    }
  }, [currentDate, selectedEmployees, assignments, user?.role, sortedEmployees.length, dateForComparison, autoRemovedEmployees]);

  const visibleEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? sortedEmployees.filter(emp => (emp?.name || '').toLowerCase().includes(term))
      : sortedEmployees;
    // Keep selected employees at the top so they can be removed without scrolling.
    const selectedSet = new Set(selectedEmployees);
    const selected = filtered.filter(emp => selectedSet.has(emp.id));
    const rest = filtered.filter(emp => !selectedSet.has(emp.id));
    return [...selected, ...rest];
  }, [sortedEmployees, searchTerm, selectedEmployees]);

  const renderSearchField = () => (
    <div className="sticky top-0 z-10 bg-popover border-b p-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('employees.searchPlaceholder')}
          className="pl-8 h-9"
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );

  // Virtualization: only visible rows are rendered so the selector stays fast
  // even with several hundred employees in a department.
  const scrollRef = useRef<HTMLDivElement>(null);
  const columns = isMobile ? 1 : 2;

  const employeeRows = useMemo(() => {
    const rows: Employee[][] = [];
    for (let i = 0; i < visibleEmployees.length; i += columns) {
      rows.push(visibleEmployees.slice(i, i + columns));
    }
    return rows;
  }, [visibleEmployees, columns]);

  const rowVirtualizer = useVirtualizer({
    count: employeeRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 60,
    overscan: 8,
  });

  useEffect(() => {
    if (employeeRows.length > 0) {
      rowVirtualizer.scrollToIndex(0);
    }
    // Reset scroll position whenever the filtered result changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Re-measure once the popover/drawer has mounted so the virtualizer
  // never observes a 0-height scroll element and returns zero rows.
  useEffect(() => {
    if (open) {
      // Wait for the portal/animation frame before measuring.
      const raf = requestAnimationFrame(() => rowVirtualizer.measure());
      return () => cancelAnimationFrame(raf);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employeeRows.length]);

  const renderEmployeeButton = (employee: Employee, isLast: boolean) => {


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
          
          const isOnTraining = trainingIdsForDate.has(employee.id);
          // Fully booked (8+ hours across assignments on the selected date) => not selectable.
          // Partially booked (< 8 hours) stays selectable for additional assignments.
          const isFullyBooked = availabilityInfo.status === 'fullyBooked';
          // Already selected for THIS assignment => always toggleable (can be removed again).
          const isDisabled = !isSelected && (
            (vacationStatus.isOnVacation && vacationStatus.vacationType === 'full_day')
            || isManuallyOnLeave
            || isExpired
            || isOnTraining
            || isFullyBooked
            || employee.status === 'terminated'
            || employee.status === 'inactive'
          );

          // Explain WHY a locked employee cannot be selected (priority order)
          let lockReason: string | null = null;
          if (isDisabled) {
            if (vacationStatus.isOnVacation && vacationStatus.vacationType === 'full_day') {
              lockReason = t('employees.lockedReasonVacation');
            } else if (isManuallyOnLeave) {
              lockReason = t('employees.lockedReasonOnLeave');
            } else if (isOnTraining) {
              lockReason = t('employees.lockedReasonTraining');
            } else if (isFullyBooked) {
              const hours = ((availabilityInfo.bookedMinutes ?? 480) / 60)
                .toFixed(1)
                .replace('.', currentLanguage === 'da' ? ',' : '.');
              lockReason = t('employees.lockedReasonFullyBooked', { hours });
            } else if (isExpired) {
              lockReason = t('employees.lockedReasonExpired');
            } else if (employee.status === 'terminated') {
              lockReason = t('employees.lockedReasonTerminated');
            } else if (employee.status === 'inactive') {
              lockReason = t('employees.lockedReasonInactive');
            }
          }

          const dist = distanceMap.get(employee.id);
          const isNearby = dist != null && dist <= 15;
          const isTop3 = top3NearbyIds.includes(employee.id);
          const formattedDist = dist != null
            ? (currentLanguage === 'da' ? dist.toFixed(1).replace('.', ',') : dist.toFixed(1))
            : null;
          
          return (
            <Tooltip key={employee.id}>
              <TooltipTrigger asChild>
            <button
              type="button"
              disabled={isDisabled}
              className={`w-full text-left flex items-center gap-3 py-3 px-4 transition-colors ${
                !isLast ? 'border-b border-border/40' : ''
              } ${
                isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'
              } ${
                isSelected ? 'bg-accent/30' : ''
              }`}
              onPointerUp={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!isDisabled) {
                  onToggle(employee.id);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
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
                    <span className="font-medium text-foreground truncate flex items-center gap-1.5">
                      {allSelectedDates.length > 0 && multiDateAvailability.has(employee.id) && (
                        <span
                          className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                            multiDateAvailability.get(employee.id) === 'full'
                              ? 'bg-green-500'
                              : multiDateAvailability.get(employee.id) === 'partial'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        />
                      )}
                      {employee.name}
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 leading-none ${getRoleBadgeClass(employee.role)}`}
                      >
                        {t(`employees.${employee.role}`) || employee.role}
                      </Badge>
                    </span>
                    {isNearby && formattedDist && (
                      <span className={`text-xs flex items-center gap-1 mt-0.5 ${isTop3 ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                        <MapPin className={`h-3 w-3 ${isTop3 ? 'text-green-600' : ''}`} />
                        {formattedDist} km {currentLanguage === 'da' ? 'væk' : 'away'}
                      </span>
                    )}
                    {isDisabled && lockReason && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {lockReason}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    {isOnTraining && (
                      <Badge size="sm" className="bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-100">
                        Kursus
                      </Badge>
                    )}
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
            </button>
              </TooltipTrigger>
              {lockReason && (
                <TooltipContent side="top" className="max-w-xs">
                  {lockReason}
                </TooltipContent>
              )}
            </Tooltip>

          );
        } catch (err) {
          if (import.meta.env.DEV) console.error(`[EmployeeSelector] Error rendering employee ${employee?.name || 'unknown'}:`, err);
          return null;
        }
  };

  const renderEmployeeList = () => {
    const virtualRows = rowVirtualizer.getVirtualItems();
    return (
      <TooltipProvider delayDuration={200}>
        {employeesLoading ? (
          <div className="space-y-2 py-2" aria-label={`${t('common.loading')}...`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-x-2">
                <div className="flex items-center gap-3 px-2 py-2.5">
                  <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visibleEmployees.length === 0 ? (
          <div className="py-8 px-4 flex flex-col items-center text-center gap-2">
            <Users className="h-8 w-8 text-muted-foreground/50" />
            {searchTerm.trim() ? (
              <>
                <p className="text-sm font-medium">{t('employees.noSearchResults')}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSearchTerm('')}
                >
                  {t('employees.clearSearch')}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t('employees.noEmployeesAvailable')}</p>
            )}
          </div>
        ) : virtualRows.length === 0 ? (
          // Fallback: virtualizer has not measured yet (e.g. popover just
          // opened). Render rows plainly so the list is never blank.
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 py-1">
            {visibleEmployees.map((employee, index) => (
              <React.Fragment key={employee.id}>
                {renderEmployeeButton(employee, index === visibleEmployees.length - 1)}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div
            className="relative w-full py-1"
            style={{ height: rowVirtualizer.getTotalSize() }}
          >
            {virtualRows.map((virtualRow) => {
              const row = employeeRows[virtualRow.index];
              const isLastRow = virtualRow.index === employeeRows.length - 1;
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute left-0 top-0 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-2"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  {row.map((employee) => (
                    <React.Fragment key={employee.id}>
                      {renderEmployeeButton(employee, isLastRow)}
                    </React.Fragment>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </TooltipProvider>
    );
  };


  const triggerButton = (
    <Button 
      variant="outline" 
      className="w-full justify-between h-11 px-4 py-2"
    >
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span className="truncate">{getDisplayText()}</span>
      </div>
    </Button>
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('planner.employees')}</label>
      
      {autoRemovedEmployees.length > 0 && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          {t('employees.autoRemovedUnavailable')}: {autoRemovedEmployees.join(', ')}
        </div>
      )}
      
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            {triggerButton}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('planner.employees')}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4">{renderSearchField()}</div>
            <div 
              ref={scrollRef}
              className="h-[65dvh] max-h-[80dvh] overflow-y-auto px-4 pb-4"
              style={{ touchAction: 'pan-y', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >

              {renderEmployeeList()}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover modal={true} open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
          <PopoverContent
            className="w-[760px] max-w-[calc(100vw-2rem)] p-0 z-[60] bg-popover border shadow-lg"
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={16}
          >
            {renderSearchField()}
            <div 
              ref={scrollRef}
              className="max-h-[min(50vh,420px)] overflow-y-auto"


              onWheel={(e) => e.stopPropagation()}
            >
              {renderEmployeeList()}
            </div>
          </PopoverContent>
        </Popover>
      )}

    </div>
  );
};

export default EmployeeSelector;
