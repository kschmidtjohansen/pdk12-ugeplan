
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Users, Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { format, addDays, subDays } from 'date-fns';
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

const UnassignedResourcesSection: React.FC<UnassignedResourcesSectionProps> = ({
  assignments,
  employees,
  cars,
  vacations
}) => {
  const { t, currentLanguage } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  const [showAllCars, setShowAllCars] = useState(false);

  const formatDate = (date: Date) => {
    const locale = currentLanguage === 'da' ? da : undefined;

    // Format with day name first for Danish, e.g., "Tirsdag, 3. jun 2025"
    if (currentLanguage === 'da') {
      const dayName = format(date, 'EEEE', { locale }); // Full day name
      const dateFormatted = format(date, 'd. MMM yyyy', { locale }); // Day with period, month abbreviation

      // Capitalize first letter of day name
      const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return `${capitalizedDayName}, ${dateFormatted}`;
    } else {
      // For English, use a similar format: "Tuesday, 3 Jun 2025"
      return format(date, 'EEEE, d MMM yyyy', { locale });
    }
  };

  const getUnassignedCars = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAssignments = assignments.filter(a => a.date === dateStr);
    const assignedCarIds = new Set(dayAssignments.map(assignment => assignment.car).filter(car => car).map(car => typeof car === 'string' ? car : car?.id).filter(Boolean));
    return cars.filter(car => car.is_available && !assignedCarIds.has(car.id));
  };

  // Get available and partially available employees only
  const getAvailableEmployees = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Filter to service employees only
    const serviceEmployees = employees.filter(employee => employee.role === 'servicemedarbejder');
    
    const availableEmployeesWithStatus = serviceEmployees
      .map(employee => {
        const status = getEmployeeAvailabilityStatus(employee, date, assignments, vacations, t);
        return {
          employee,
          status
        };
      })
      .filter(({ status }) => {
        return status.status === 'available' || status.status === 'partiallyBooked';
      });
      
    return availableEmployeesWithStatus;
  };

  const unassignedCars = getUnassignedCars(selectedDate);
  const availableEmployeesWithStatus = getAvailableEmployees(selectedDate);

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const displayedEmployees = showAllEmployees ? availableEmployeesWithStatus : availableEmployeesWithStatus.slice(0, 6);
  const displayedCars = showAllCars ? unassignedCars : unassignedCars.slice(0, 3);

  return (
    <div className="border border-primary/20 rounded-lg p-6 mb-6 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h5 className="font-semibold text-primary text-lg">
              {t('planner.unassignedResources')}
            </h5>
            <p className="text-sm text-muted-foreground">
              {availableEmployeesWithStatus.length + unassignedCars.length} {t('planner.availableResources')}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-primary hover:text-primary/80 hover:bg-primary/10">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4 p-3 bg-background/50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleToday} className="h-8">
                {t('planner.today')}
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={handlePreviousDay} className="h-8 w-8 p-0">
                  ←
                </Button>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded font-medium text-sm border border-primary/20 min-w-[200px] text-center">
                  {formatDate(selectedDate)}
                </span>
                <Button variant="outline" size="sm" onClick={handleNextDay} className="h-8 w-8 p-0">
                  →
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border">
                <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <span className="font-medium text-foreground">{t('planner.employees')}</span>
                  <span className="text-sm text-muted-foreground ml-2">({availableEmployeesWithStatus.length})</span>
                </div>
              </div>
              <div className="space-y-2">
                {displayedEmployees.map(({ employee, status }) => (
                  <div key={employee.id} className="p-3 bg-background border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{employee.name}</span>
                      <Badge className={`text-xs ${status.badgeColor}`}>
                        {status.statusText}
                      </Badge>
                    </div>
                  </div>
                ))}
                {availableEmployeesWithStatus.length > 6 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllEmployees(!showAllEmployees)} className="text-sm text-primary hover:text-primary/80 p-2 h-auto w-full">
                    {showAllEmployees ? t('planner.showLess') : `+${availableEmployeesWithStatus.length - 6} ${t('planner.showMore')}`}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border">
                <div className="p-1.5 rounded bg-green-500/10 border border-green-500/20">
                  <Car className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <span className="font-medium text-foreground">{t('planner.unassignedCars')}</span>
                  <span className="text-sm text-muted-foreground ml-2">({unassignedCars.length})</span>
                </div>
              </div>
              {unassignedCars.length === 0 ? (
                <div className="p-4 bg-muted/50 rounded-lg border-dashed border-2 text-center">
                  <p className="text-sm text-muted-foreground">{t('planner.allCarsAssigned')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedCars.map(car => (
                    <div key={car.id} className="p-3 bg-background border rounded-lg hover:shadow-sm transition-shadow">
                      <span className="font-medium text-foreground">{car.car_number} - {car.name}</span>
                    </div>
                  ))}
                  {unassignedCars.length > 3 && (
                    <Button variant="ghost" size="sm" onClick={() => setShowAllCars(!showAllCars)} className="text-sm text-primary hover:text-primary/80 p-2 h-auto w-full">
                      {showAllCars ? t('planner.showLess') : `+${unassignedCars.length - 3} ${t('planner.showMore')}`}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnassignedResourcesSection;
