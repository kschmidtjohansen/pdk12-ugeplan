import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Car, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, AlertCircle, ShieldCheck, Wrench } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment, normalizeEmployees } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Car as CarType } from '@/types/car';
import { Vacation } from '@/types/vacation';
import { getEmployeeAvailabilityStatus, EmployeeAvailabilityStatus } from '@/utils/employeeAvailability';
import { format, parseISO, addDays, isSameDay, isWithinInterval } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UnassignedResourcesSectionProps {
  assignments: Assignment[];
  employees: Employee[];
  cars: CarType[];
  vacations: Vacation[];
  weekDates?: {
    start: Date;
    end: Date;
  };
}

const UnassignedResourcesSection: React.FC<UnassignedResourcesSectionProps> = ({
  assignments,
  employees,
  cars,
  vacations,
  weekDates
}) => {
  const {
    t,
    currentLanguage
  } = useTranslation();
  
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
        // Default to today if it's in the current week, otherwise first day of the week
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
  
  console.log('[UnassignedResourcesSection] Analyzing resources for date:', targetDate);

  // Get assigned employee IDs for the target date using proper ID-based matching
  const assignedEmployeeIds = useMemo(() => {
    if (!assignments || !Array.isArray(assignments)) return new Set<string>();
    const assigned = new Set<string>();
    
    assignments.filter(assignment => assignment.date === targetDate).forEach(assignment => {
      // Handle assignedEmployees (new format with full employee objects)
      if (assignment.assignedEmployees && Array.isArray(assignment.assignedEmployees)) {
        assignment.assignedEmployees.forEach(emp => {
          if (typeof emp === 'object' && emp.id) {
            assigned.add(emp.id);
          }
        });
      }

      // Handle employees array (could be IDs or names - normalize first)
      if (assignment.employees) {
        const employeeIds = normalizeEmployees(assignment.employees);
        employeeIds.forEach(id => {
          // If it looks like a UUID, use it directly
          if (typeof id === 'string' && (id.length === 36 || id.includes('-'))) {
            assigned.add(id);
          } else {
            // Otherwise, try to find employee by name
            const employee = employees.find(emp => emp.name === id);
            if (employee) {
              assigned.add(employee.id);
            }
          }
        });
      }
    });
    
    return assigned;
  }, [assignments, employees, targetDate]);

  // Get assigned car IDs for the target date
  const assignedCarIds = useMemo(() => {
    if (!assignments || !Array.isArray(assignments)) return new Set<string>();
    const assigned = new Set<string>();
    assignments.filter(assignment => assignment.date === targetDate).forEach(assignment => {
      // Handle multiple cars
      if (assignment.cars && Array.isArray(assignment.cars)) {
        assignment.cars.forEach(carId => assigned.add(carId));
      }

      // Handle single car
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

  // Calculate comprehensive employee availability using proper status logic
  const employeeAvailabilityData = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return {
      available: [],
      partiallyBooked: [],
      fullyBooked: [],
      onLeave: [],
      onVacation: []
    };
    
    // Filter out demo user from production view
    const DEMO_USER_EMAIL = 'test@polygongroup.com';
    const DEMO_USER_ID = '165cdbc9-6722-4c96-97d2-1a87185c8133';
    const isDemoMode = user?.email === DEMO_USER_EMAIL;
    
    const filteredEmployees = isDemoMode 
      ? employees 
      : employees.filter(emp => 
          emp.email !== DEMO_USER_EMAIL && 
          emp.id !== DEMO_USER_ID
        );
    
    const categorized = {
      available: [] as Array<Employee & { availabilityInfo?: any }>,
      partiallyBooked: [] as Array<Employee & { availabilityInfo?: any }>,
      fullyBooked: [] as Array<Employee & { availabilityInfo?: any }>,
      onLeave: [] as Array<Employee & { availabilityInfo?: any }>,
      onVacation: [] as Array<Employee & { availabilityInfo?: any }>
    };
    
    filteredEmployees.forEach(employee => {
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
  }, [employees, assignments, vacations, targetDateObj, user?.email, t]);

  // Calculate available cars
  const availableCars = useMemo(() => {
    if (!cars || !Array.isArray(cars)) return [];
    return cars.filter(car => {
      // Skip if not available
      if (!car.is_available) return false;

      // Skip if not shown in planner
      if (car.show_in_planner === false) return false;

      // Skip if assigned
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

  console.log('[UnassignedResourcesSection] Resource analysis:', {
    targetDate,
    stats,
    totalEmployees: employees.length
  });

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const locale = currentLanguage === 'da' ? da : undefined;
    return format(date, 'EEE d. MMM', {
      locale
    });
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
      {/* Main Resource Overview Card */}
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="py-2 px-4 bg-gradient-to-r from-primary/5 to-primary/10">
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

        {/* Summary Statistics Row (Always Visible) */}
        <CardContent className="py-2 border-b">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Available Employees */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-4 w-4 text-emerald-600" />
                <span className="text-xl font-bold text-emerald-600">
                  {stats.totalAvailableEmployees}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t('planner.availableCount')} {t('employees.employees')}</p>
            </div>

            {/* Available Cars */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Car className="h-4 w-4 text-blue-600" />
                <span className="text-xl font-bold text-blue-600">
                  {stats.availableCars}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t('planner.availableCount')} {t('planner.availableCars')}</p>
            </div>

            {/* On Vacation */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-xl font-bold text-orange-600">
                  {stats.onVacationEmployees}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t('planner.onVacationCount')} {t('employees.employees')}</p>
            </div>

            {/* Partially Available */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-xl font-bold text-amber-600">
                  {stats.partiallyBookedEmployees}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t('planner.partiallyBookedCount')} {t('employees.employees')}</p>
            </div>
          </div>
        </CardContent>

        {/* Detailed View (Collapsible) */}
        {!isCollapsed && (
          <CardContent className="pt-2">
            <div className="space-y-4">
              {/* Categorize available employees by role */}
              {(() => {
                const allAvailable = [...employeeAvailabilityData.available, ...employeeAvailabilityData.partiallyBooked];
                const skadeledere = allAvailable.filter(emp => emp.role === 'skadeleder' || emp.role === 'administrator');
                const servicemedarbejdere = allAvailable.filter(emp => emp.role === 'servicemedarbejder' || emp.role === 'vikar');
                
                return (
                  <>
                    {/* Skadeledere Section */}
                    {skadeledere.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          {t('planner.skadeledere')} ({skadeledere.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                          {skadeledere.map(employee => {
                            const isPartial = employeeAvailabilityData.partiallyBooked.some(e => e.id === employee.id);
                            return (
                              <div 
                                key={employee.id} 
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg border",
                                  isPartial 
                                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" 
                                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{employee.name}</span>
                                  {isPartial && (
                                    <span className="text-xs text-amber-700 dark:text-amber-400">
                                      {employee.availabilityInfo?.text}
                                    </span>
                                  )}
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs",
                                    isPartial 
                                      ? "bg-amber-100 text-amber-700 border-amber-300" 
                                      : "bg-blue-100 text-blue-700 border-blue-300"
                                  )}
                                >
                                  {isPartial ? t('planner.employeeStatusPartial') : t('planner.employeeStatusAvailable')}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Servicemedarbejdere Section */}
                    {servicemedarbejdere.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          {t('planner.servicemedarbejdere')} ({servicemedarbejdere.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                          {servicemedarbejdere.map(employee => {
                            const isPartial = employeeAvailabilityData.partiallyBooked.some(e => e.id === employee.id);
                            return (
                              <div 
                                key={employee.id} 
                                className={cn(
                                  "flex items-center justify-between p-2 rounded-lg border",
                                  isPartial 
                                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" 
                                    : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{employee.name}</span>
                                  {isPartial && (
                                    <span className="text-xs text-amber-700 dark:text-amber-400">
                                      {employee.availabilityInfo?.text}
                                    </span>
                                  )}
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs",
                                    isPartial 
                                      ? "bg-amber-100 text-amber-700 border-amber-300" 
                                      : "bg-purple-100 text-purple-700 border-purple-300"
                                  )}
                                >
                                  {isPartial ? t('planner.employeeStatusPartial') : t('planner.employeeStatusAvailable')}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Available Cars */}
              {availableCars.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {t('planner.availableCars')} ({availableCars.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                    {availableCars.map(car => (
                      <div key={car.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex flex-col">
                          <span className="font-medium">{car.name}</span>
                          <span className="text-xs text-muted-foreground">{car.number_plate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {car.has_trailer_hitch && (
                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
                              {t('planner.carWithTrailerLabel')}
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                            {t('planner.carStatusAvailable')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Employees on Vacation */}
              {employeeAvailabilityData.onVacation.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {t('planner.onVacationEmployees')} ({employeeAvailabilityData.onVacation.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {employeeAvailabilityData.onVacation.map(employee => (
                      <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                        <div className="flex flex-col">
                          <span className="font-medium text-orange-800">{employee.name}</span>
                          <span className="text-xs text-orange-700">
                            {employee.availabilityInfo?.text}
                          </span>
                        </div>
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                          {t('planner.employeeStatusVacation')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {stats.totalAvailableEmployees === 0 && stats.availableCars === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    {t('planner.noAvailableResources')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
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
