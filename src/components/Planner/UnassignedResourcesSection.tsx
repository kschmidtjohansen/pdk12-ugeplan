import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Car, Calendar } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Car as CarType } from '@/types/car';
import { Vacation } from '@/types/vacation';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';

interface UnassignedResourcesSectionProps {
  assignments: Assignment[];
  employees: Employee[];
  cars: CarType[];
  vacations: Vacation[];
  selectedDate?: string;
}

const UnassignedResourcesSection: React.FC<UnassignedResourcesSectionProps> = ({
  assignments,
  employees,
  cars,
  vacations,
  selectedDate
}) => {
  const { t, currentLanguage } = useTranslation();
  
  // Get current date if no selectedDate provided
  const targetDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
  
  console.log('[UnassignedResourcesSection] Analyzing resources for date:', targetDate);
  
  // Get employees on vacation for the target date
  const employeesOnVacation = useMemo(() => {
    if (!vacations || !Array.isArray(vacations)) return [];
    
    const targetDateObj = parseISO(targetDate);
    
    return vacations
      .filter(vacation => {
        if (vacation.status !== 'approved') return false;
        
        const startDate = parseISO(vacation.start_date);
        const endDate = parseISO(vacation.end_date);
        
        return targetDateObj >= startDate && targetDateObj <= endDate;
      })
      .map(vacation => {
        const employee = employees.find(emp => emp.id === vacation.user_id);
        return employee ? employee.name : 'Unknown Employee';
      })
      .filter(Boolean);
  }, [vacations, employees, targetDate]);

  // Get assigned employees for the target date
  const assignedEmployeeNames = useMemo(() => {
    if (!assignments || !Array.isArray(assignments)) return new Set<string>();
    
    const assigned = new Set<string>();
    
    assignments
      .filter(assignment => assignment.date === targetDate)
      .forEach(assignment => {
        // Add employees from assignedEmployees (full data)
        if (assignment.assignedEmployees && Array.isArray(assignment.assignedEmployees)) {
          assignment.assignedEmployees.forEach(emp => assigned.add(emp.name));
        }
        
        // Add employees from legacy employees array
        if (assignment.employees && Array.isArray(assignment.employees)) {
          assignment.employees.forEach(empName => {
            if (typeof empName === 'string') {
              assigned.add(empName);
            }
          });
        }
      });
    
    return assigned;
  }, [assignments, targetDate]);

  // Get assigned car IDs for the target date
  const assignedCarIds = useMemo(() => {
    if (!assignments || !Array.isArray(assignments)) return new Set<string>();
    
    const assigned = new Set<string>();
    
    assignments
      .filter(assignment => assignment.date === targetDate)
      .forEach(assignment => {
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

  // Calculate available employees
  const availableEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return [];
    
    return employees.filter(employee => {
      // Skip if on vacation
      if (employeesOnVacation.includes(employee.name)) return false;
      
      // Skip if assigned to a task
      if (assignedEmployeeNames.has(employee.name)) return false;
      
      // Skip if on leave
      if (employee.onLeave) return false;
      
      return true;
    });
  }, [employees, employeesOnVacation, assignedEmployeeNames]);

  // Calculate available cars
  const availableCars = useMemo(() => {
    if (!cars || !Array.isArray(cars)) return [];
    
    return cars.filter(car => {
      // Skip if not available
      if (!car.is_available) return false;
      
      // Skip if assigned
      if (assignedCarIds.has(car.id)) return false;
      
      return true;
    });
  }, [cars, assignedCarIds]);

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const locale = currentLanguage === 'da' ? da : undefined;
    return format(date, 'EEE d. MMM', { locale });
  };

  console.log('[UnassignedResourcesSection] Resource analysis:', {
    targetDate,
    totalEmployees: employees.length,
    employeesOnVacation: employeesOnVacation.length,
    assignedEmployees: assignedEmployeeNames.size,
    availableEmployees: availableEmployees.length,
    totalCars: cars.length,
    assignedCars: assignedCarIds.size,
    availableCars: availableCars.length
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">
          {t('planner.unassignedResources') || 'Ikke-tildelte Ressourcer'}
        </h2>
        <Badge variant="outline" className="ml-2">
          {formatDate(targetDate)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available Employees */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              {t('planner.availableEmployees') || 'Tilgængelige Medarbejdere'}
              <Badge variant="secondary" className="ml-auto">
                {availableEmployees.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableEmployees.length > 0 ? (
              <div className="space-y-2">
                {availableEmployees.map(employee => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200"
                  >
                    <span className="font-medium text-sm">{employee.name}</span>
                    <Badge variant="outline" className="text-xs bg-emerald-100">
                      {t('planner.employeeAvailable') || 'Tilgængelig'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('planner.noEmployeesAvailable') || 'Alle medarbejdere er tildelt eller på ferie'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Available Cars */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-600" />
              {t('planner.availableCars') || 'Tilgængelige Biler'}
              <Badge variant="secondary" className="ml-auto">
                {availableCars.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableCars.length > 0 ? (
              <div className="space-y-2">
                {availableCars.map(car => (
                  <div
                    key={car.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{car.name}</span>
                      <span className="text-xs text-muted-foreground">{car.number_plate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {car.has_trailer_hitch && (
                        <Badge variant="outline" className="text-xs bg-orange-100">
                          {t('planner.carWithTrailer') || 'Med trailer'}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs bg-blue-100">
                        {t('planner.available') || 'Tilgængelig'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('planner.noCarsAvailable') || 'Alle biler er tildelt'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employees on Vacation */}
      {employeesOnVacation.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              {t('planner.employeesOnVacation') || 'Medarbejdere på Ferie'}
              <Badge variant="secondary" className="ml-auto">
                {employeesOnVacation.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {employeesOnVacation.map((employeeName, index) => (
                <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700">
                  {employeeName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnassignedResourcesSection;