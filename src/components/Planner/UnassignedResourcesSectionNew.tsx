import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Users, Car, Calendar, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { format, addDays, subDays, isToday, isTomorrow } from 'date-fns';
import { da } from 'date-fns/locale';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Car as CarType } from '@/types/car';
import { Vacation } from '@/types/vacation';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';

interface UnassignedResourcesSectionProps {
  assignments: Assignment[];
  employees: Employee[];
  cars: CarType[];
  vacations: Vacation[];
}

const UnassignedResourcesSectionNew: React.FC<UnassignedResourcesSectionProps> = ({
  assignments,
  employees,
  cars,
  vacations
}) => {
  const { t, currentLanguage } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date: Date) => {
    const locale = currentLanguage === 'da' ? da : undefined;

    if (isToday(date)) {
      return t('common.today') || 'I dag';
    } else if (isTomorrow(date)) {
      return t('common.tomorrow') || 'I morgen';
    }

    if (currentLanguage === 'da') {
      const dayName = format(date, 'EEEE', { locale });
      const dateFormatted = format(date, 'd. MMM yyyy', { locale });
      const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return `${capitalizedDayName}, ${dateFormatted}`;
    } else {
      return format(date, 'EEEE, d MMM yyyy', { locale });
    }
  };

  // PHASE 3 FIX: Enhanced assignment filtering with proper date and employee matching
  const getAssignedResourcesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log(`[UnassignedResourcesSection] PHASE 3 FIX - Getting assignments for ${dateStr}`);
    
    const dayAssignments = assignments.filter(assignment => {
      const assignmentDateStr = assignment.date.includes('T') 
        ? assignment.date.split('T')[0] 
        : assignment.date;
      const matches = assignmentDateStr === dateStr;
      
      if (matches) {
        console.log(`[UnassignedResourcesSection] PHASE 3 FIX - Found assignment for ${dateStr}:`, {
          title: assignment.title,
          employees: assignment.employees,
          assignedEmployees: assignment.assignedEmployees,
          cars: assignment.cars,
          car: assignment.car
        });
      }
      
      return matches;
    });

    // Get assigned car IDs
    const assignedCarIds = new Set<string>();
    dayAssignments.forEach(assignment => {
      if (assignment.cars && Array.isArray(assignment.cars)) {
        assignment.cars.forEach(carId => assignedCarIds.add(carId));
      }
      if (assignment.car) {
        if (typeof assignment.car === 'string') {
          assignedCarIds.add(assignment.car);
        } else if (assignment.car && typeof assignment.car === 'object' && 'id' in assignment.car) {
          assignedCarIds.add(assignment.car.id);
        }
      }
    });

    // Get assigned employee IDs/names  
    const assignedEmployeeNames = new Set<string>();
    const assignedEmployeeIds = new Set<string>();
    
    dayAssignments.forEach(assignment => {
      // Handle both legacy employee names and new assigned employees
      if (assignment.employees && Array.isArray(assignment.employees)) {
        assignment.employees.forEach(emp => assignedEmployeeNames.add(emp));
      }
      
      if (assignment.assignedEmployees && Array.isArray(assignment.assignedEmployees)) {
        assignment.assignedEmployees.forEach(emp => {
          assignedEmployeeNames.add(emp.name);
          assignedEmployeeIds.add(emp.id);
        });
      }
    });

    console.log(`[UnassignedResourcesSection] PHASE 3 FIX - Assigned resources for ${dateStr}:`, {
      carIds: Array.from(assignedCarIds),
      employeeNames: Array.from(assignedEmployeeNames),
      employeeIds: Array.from(assignedEmployeeIds)
    });

    return { assignedCarIds, assignedEmployeeNames, assignedEmployeeIds };
  };

  // PHASE 3 FIX: Enhanced available employees calculation
  const availableEmployees = useMemo(() => {
    const serviceEmployees = employees.filter(employee => employee.role === 'servicemedarbejder');
    const { assignedEmployeeNames, assignedEmployeeIds } = getAssignedResourcesForDate(selectedDate);
    
    return serviceEmployees
      .map(employee => {
        const status = getEmployeeAvailabilityStatus(employee, selectedDate, assignments, vacations, t);
        
        // Check if employee is assigned (by name or ID)
        const isAssigned = assignedEmployeeNames.has(employee.name) || assignedEmployeeIds.has(employee.id);
        
        return {
          employee,
          status,
          isAssigned
        };
      })
      .filter(({ status, isAssigned }) => {
        // Show available or partially available employees who are not assigned
        const isAvailable = status.status === 'available' || status.status === 'partiallyBooked';
        return isAvailable && !isAssigned;
      });
  }, [employees, selectedDate, assignments, vacations, t]);

  // PHASE 3 FIX: Enhanced available cars calculation
  const availableCars = useMemo(() => {
    const { assignedCarIds } = getAssignedResourcesForDate(selectedDate);
    
    return cars.filter(car => 
      car.is_available && !assignedCarIds.has(car.id)
    );
  }, [cars, selectedDate, assignments]);

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  console.log(`[UnassignedResourcesSection] PHASE 3 FIX - Results for ${format(selectedDate, 'yyyy-MM-dd')}:`, {
    availableEmployees: availableEmployees.length,
    availableCars: availableCars.length,
    totalEmployees: employees.length,
    totalCars: cars.length
  });

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-primary text-lg font-semibold">
                {t('planner.unassignedResources')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {availableEmployees.length + availableCars.length} {t('planner.availableResources')}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-primary hover:text-primary/80 hover:bg-primary/10"
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Enhanced Date Navigation */}
          <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToday} 
                className="h-9 px-4 font-medium"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t('planner.today')}
              </Button>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousDay} 
                  className="h-9 w-9 p-0"
                >
                  ←
                </Button>
                <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold text-sm border border-primary/20 min-w-[220px] text-center">
                  {formatDate(selectedDate)}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextDay} 
                  className="h-9 w-9 p-0"
                >
                  →
                </Button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Employees */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <Users className="h-5 w-5" />
                  {t('planner.availableEmployees')} ({availableEmployees.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableEmployees.length === 0 ? (
                  <div className="p-4 bg-emerald-100/50 rounded-lg border-dashed border-2 border-emerald-200 text-center">
                    <p className="text-sm text-emerald-600 font-medium">
                      Alle medarbejdere er tildelt eller ikke tilgængelige
                    </p>
                  </div>
                ) : (
                  availableEmployees.slice(0, 8).map(({ employee, status }) => (
                    <div 
                      key={employee.id} 
                      className="p-3 bg-background border border-emerald-200 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{employee.name}</span>
                        <Badge className={`text-xs ${status.badgeColor}`}>
                          {status.statusText}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Available Cars */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Car className="h-5 w-5" />
                  {t('planner.availableCars')} ({availableCars.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableCars.length === 0 ? (
                  <div className="p-4 bg-blue-100/50 rounded-lg border-dashed border-2 border-blue-200 text-center">
                    <p className="text-sm text-blue-600 font-medium">
                      {t('planner.allCarsAssigned')}
                    </p>
                  </div>
                ) : (
                  availableCars.slice(0, 6).map(car => (
                    <div 
                      key={car.id} 
                      className="p-3 bg-background border border-blue-200 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {car.car_number} - {car.name}
                        </span>
                        {car.has_trailer_hitch && (
                          <Badge variant="outline" className="text-xs">
                            Trailer
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default UnassignedResourcesSectionNew;