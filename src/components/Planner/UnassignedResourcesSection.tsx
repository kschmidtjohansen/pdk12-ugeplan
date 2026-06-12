import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Car, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, AlertCircle, UserCheck, Wrench } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Car as CarType } from '@/types/car';
import { Vacation } from '@/types/vacation';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';
import { format, parseISO, addDays, isWithinInterval } from 'date-fns';
import { da } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UnassignedResourcesSectionProps {
  assignments: Assignment[];
  employees: Employee[];
  cars: CarType[];
  vacations: Vacation[];
  weekDates?: {
    start: Date;
    end: Date;
  };
  crossBusyByDate?: Record<string, { employees: Set<string>; cars: Set<string> }>;
}

const UnassignedResourcesSection: React.FC<UnassignedResourcesSectionProps> = ({
  assignments,
  employees,
  cars,
  vacations,
  weekDates,
  crossBusyByDate,
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();

  // State for collapsible functionality
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('unassignedResourcesCollapsed');
    return saved ? JSON.parse(saved) : true;
  });

  // State for selected date with proper week clamping
  const [selectedDate, setSelectedDate] = useState(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });

  // Clamp selectedDate to current week when weekDates changes
  useEffect(() => {
    if (weekDates?.start && weekDates?.end) {
      const currentSelectedDate = parseISO(selectedDate);
      const isInCurrentWeek = isWithinInterval(currentSelectedDate, {
        start: weekDates.start,
        end: weekDates.end
      });
      
      if (!isInCurrentWeek) {
        const today = new Date();
        const defaultDate = isWithinInterval(today, {
          start: weekDates.start,
          end: weekDates.end
        }) ? today : weekDates.start;
        
        setSelectedDate(format(defaultDate, 'yyyy-MM-dd'));
      }
    }
  }, [weekDates, selectedDate]);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('unassignedResourcesCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const targetDate = selectedDate;
  const targetDateObj = parseISO(targetDate);

  // Get assigned car IDs for the target date
  const assignedCarIds = useMemo(() => {
    if (!assignments || !Array.isArray(assignments)) return new Set<string>();
    const assigned = new Set<string>();
    assignments.filter(assignment => assignment.date === targetDate).forEach(assignment => {
      if (assignment.cars && Array.isArray(assignment.cars)) {
        assignment.cars.forEach(carId => assigned.add(carId));
      }
      if (assignment.car) {
        if (typeof assignment.car === 'string') {
          assigned.add(assignment.car);
        } else if (typeof assignment.car === 'object' && assignment.car.id) {
          assigned.add(assignment.car.id);
        }
      }
    });
    return assigned;
  }, [assignments, targetDate]);

  // Calculate comprehensive employee availability
  const employeeAvailabilityData = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return {
      available: [],
      partiallyBooked: [],
      fullyBooked: [],
      onLeave: [],
      onVacation: []
    };
    
    const categorized = {
      available: [] as Array<Employee & { availabilityInfo?: any }>,
      partiallyBooked: [] as Array<Employee & { availabilityInfo?: any }>,
      fullyBooked: [] as Array<Employee & { availabilityInfo?: any }>,
      onLeave: [] as Array<Employee & { availabilityInfo?: any }>,
      onVacation: [] as Array<Employee & { availabilityInfo?: any }>
    };
    
    employees.forEach(employee => {
      const availabilityInfo = getEmployeeAvailabilityStatus(
        employee,
        targetDateObj,
        assignments,
        vacations,
        t
      );
      
      const employeeWithInfo = { ...employee, availabilityInfo };
      
      switch (availabilityInfo.status) {
        case 'available':
          categorized.available.push(employeeWithInfo);
          break;
        case 'partiallyBooked':
          categorized.partiallyBooked.push(employeeWithInfo);
          break;
        case 'fullyBooked':
          categorized.fullyBooked.push(employeeWithInfo);
          break;
        case 'onLeave':
          categorized.onLeave.push(employeeWithInfo);
          break;
        case 'onVacation':
        case 'partialVacation':
          categorized.onVacation.push(employeeWithInfo);
          break;
      }
    });
    
    return categorized;
  }, [employees, assignments, vacations, targetDateObj, t]);

  // Cross-sub-department busy sets for the selected date (employees/cars
  // booked in OTHER sub-departments of the same main department).
  const crossBusy = crossBusyByDate?.[targetDate];
  const crossBusyEmployeeIds = crossBusy?.employees ?? new Set<string>();
  const crossBusyCarIds = crossBusy?.cars ?? new Set<string>();

  // Categorize available employees by role (multi-role aware:
  // a Skadeleder who also has Fugttekniker shows up in both sections)
  const categorizedByRole = useMemo(() => {
    const allAvailable = [
      ...employeeAvailabilityData.available,
      ...employeeAvailabilityData.partiallyBooked,
    ].filter(emp => !crossBusyEmployeeIds.has(emp.id));
    const rolesOf = (emp: any): string[] => {
      const r = (emp.roles && emp.roles.length ? emp.roles : [emp.role]) as string[];
      return r || [];
    };

    const skadeledere = allAvailable.filter(emp => {
      const r = rolesOf(emp);
      return r.includes('skadeleder') || r.includes('administrator') || r.includes('super_admin');
    });
    const fugtteknikere = allAvailable.filter(emp => rolesOf(emp).includes('fugttekniker'));
    const servicemedarbejdere = allAvailable.filter(emp => {
      const r = rolesOf(emp);
      return r.includes('servicemedarbejder') || r.includes('vikar');
    });

    return { skadeledere, fugtteknikere, servicemedarbejdere };
  }, [employeeAvailabilityData, crossBusyEmployeeIds]);

  // Calculate available cars
  const availableCars = useMemo(() => {
    if (!cars || !Array.isArray(cars)) return [];
    return cars.filter(car => {
      if (!car.is_available) return false;
      if (car.show_in_planner === false) return false;
      if ((car as any).is_auxiliary === true) return false;
      if (assignedCarIds.has(car.id)) return false;
      return true;
    });
  }, [cars, assignedCarIds]);

  // Summary statistics
  const stats = useMemo(() => {
    const totalAvailable = employeeAvailabilityData.available.length + employeeAvailabilityData.partiallyBooked.length;
    return {
      availableEmployees: employeeAvailabilityData.available.length,
      partiallyBookedEmployees: employeeAvailabilityData.partiallyBooked.length,
      totalAvailableEmployees: totalAvailable,
      fullyBookedEmployees: employeeAvailabilityData.fullyBooked.length,
      onLeaveEmployees: employeeAvailabilityData.onLeave.length,
      onVacationEmployees: employeeAvailabilityData.onVacation.length,
      availableCars: availableCars.length,
      totalCars: cars.length,
      assignedCars: assignedCarIds.size
    };
  }, [employeeAvailabilityData, availableCars.length, cars.length, assignedCarIds.size]);

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const locale = currentLanguage === 'da' ? da : undefined;
    return format(date, 'EEE d. MMM', { locale });
  };

  // Generate available dates from week range
  const availableDates = useMemo(() => {
    if (!weekDates) return [targetDate];
    const dates = [];
    let currentDate = weekDates.start;
    while (currentDate <= weekDates.end) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }
    return dates;
  }, [weekDates, targetDate]);

  // Handle date navigation
  const handlePreviousDate = () => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  };

  const handleNextDate = () => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="py-2 px-4 bg-muted/40 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  {t('planner.unassignedResources')}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {formatDate(selectedDate)}
                </p>
              </div>
            </div>
            
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-background/80 rounded-lg p-0.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousDate} 
                  disabled={availableDates.indexOf(selectedDate) === 0}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                
                <div className="px-2 py-1 text-xs font-medium min-w-[100px] text-center">
                  {formatDate(selectedDate)}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextDate} 
                  disabled={availableDates.indexOf(selectedDate) === availableDates.length - 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Collapse Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                className="flex items-center gap-1 h-7 px-2"
              >
                {isCollapsed ? (
                  <>
                    <span className="hidden sm:inline text-xs">{t('planner.expandResources')}</span>
                    <ChevronDown className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline text-xs">{t('planner.collapseResources')}</span>
                    <ChevronUp className="h-3 w-3" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>


        {/* Detailed View (Collapsible) */}
        {!isCollapsed && (
          <CardContent className="pt-3">
            <div className="space-y-4">
              {/* Employees by Role - Compact */}
              <div className={`grid grid-cols-1 ${user?.role === 'fugttekniker' ? '' : 'md:grid-cols-3'} gap-4`}>
                {user?.role !== 'fugttekniker' && (
                <>
                <div>
                  <h4 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4" />
                    {t('planner.skadeledere')} ({categorizedByRole.skadeledere.length})
                  </h4>
                  {categorizedByRole.skadeledere.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {categorizedByRole.skadeledere.map(emp => (
                        <TooltipProvider key={emp.id} delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className={`text-xs cursor-default ${
                                  emp.availabilityInfo?.status === 'partiallyBooked'
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-purple-50 border-purple-200 text-purple-700'
                                }`}
                              >
                                {emp.name.split(' ')[0]}
                                {emp.availabilityInfo?.status === 'partiallyBooked' && (
                                  <Clock className="h-3 w-3 ml-1" />
                                )}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{emp.name}</p>
                              {emp.availabilityInfo?.text && (
                                <p className="text-xs text-muted-foreground">{emp.availabilityInfo.text}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{currentLanguage === 'da' ? 'Ingen tilgængelige' : 'None available'}</p>
                  )}
                </div>

                {/* Fugtteknikere — blå */}
                <div>
                  <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" />
                    {t('planner.fugtteknikere')} ({categorizedByRole.fugtteknikere.length})
                  </h4>
                  {categorizedByRole.fugtteknikere.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {categorizedByRole.fugtteknikere.map(emp => (
                        <TooltipProvider key={emp.id} delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className={`text-xs cursor-default ${
                                  emp.availabilityInfo?.status === 'partiallyBooked'
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}
                              >
                                {emp.name.split(' ')[0]}
                                {emp.availabilityInfo?.status === 'partiallyBooked' && (
                                  <Clock className="h-3 w-3 ml-1" />
                                )}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{emp.name}</p>
                              {emp.availabilityInfo?.text && (
                                <p className="text-xs text-muted-foreground">{emp.availabilityInfo.text}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{currentLanguage === 'da' ? 'Ingen tilgængelige' : 'None available'}</p>
                  )}
                </div>

                </>
                )}

                {/* Servicemedarbejdere — grøn */}
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" />
                    {t('planner.servicemedarbejdere')} ({categorizedByRole.servicemedarbejdere.length})
                  </h4>
                  {categorizedByRole.servicemedarbejdere.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {categorizedByRole.servicemedarbejdere.map(emp => (
                        <TooltipProvider key={emp.id} delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className={`text-xs cursor-default ${
                                  emp.availabilityInfo?.status === 'partiallyBooked'
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-green-50 border-green-200 text-green-700'
                                }`}
                              >
                                {emp.name.split(' ')[0]}
                                {emp.availabilityInfo?.status === 'partiallyBooked' && (
                                  <Clock className="h-3 w-3 ml-1" />
                                )}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{emp.name}</p>
                              {emp.availabilityInfo?.text && (
                                <p className="text-xs text-muted-foreground">{emp.availabilityInfo.text}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{currentLanguage === 'da' ? 'Ingen tilgængelige' : 'None available'}</p>
                  )}
                </div>
              </div>

              {/* Available Cars - Compact badges */}
              {availableCars.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Car className="h-4 w-4" />
                    {t('planner.availableCars')} ({availableCars.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCars.map(car => (
                      <TooltipProvider key={car.id} delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-slate-50 border-slate-200 cursor-default truncate max-w-[100px]"
                            >
                              {car.name}
                              {car.has_trailer_hitch && <span className="ml-1">🚗</span>}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{car.name}</p>
                            <p className="text-xs text-muted-foreground">{car.number_plate}</p>
                            {car.has_trailer_hitch && (
                              <p className="text-xs text-orange-600">{t('planner.carWithTrailerLabel')}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )}

              {/* Employees on Vacation - Compact */}
              {employeeAvailabilityData.onVacation.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    {t('planner.onVacationEmployees')} ({employeeAvailabilityData.onVacation.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {employeeAvailabilityData.onVacation.map(employee => (
                      <TooltipProvider key={employee.id} delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-orange-50 border-orange-200 text-orange-700 cursor-default"
                            >
                              {employee.name.split(' ')[0]}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{employee.name}</p>
                            {employee.availabilityInfo?.text && (
                              <p className="text-xs text-muted-foreground">{employee.availabilityInfo.text}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {stats.totalAvailableEmployees === 0 && stats.availableCars === 0 && (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                    {t('planner.noAvailableResources')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('planner.allResourcesAssigned')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default UnassignedResourcesSection;
