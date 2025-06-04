
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

  // Helper function to check if an employee is on vacation for a specific date
  const isEmployeeOnVacation = (employeeId: string, selectedDate: Date) => {
    return vacations.some(vacation => {
      if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
        return false;
      }
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      selectedDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      // Include the end date in vacation period
      return selectedDate >= startDate && selectedDate <= endDate;
    });
  };

  // Helper function to normalize time
  const normalizeTime = (time: string): string => {
    if (!time) return '';
    if (time.length === 8 && time.includes(':')) {
      time = time.substring(0, 5);
    }
    if (time.length === 5 && time.includes(':')) {
      return time;
    }
    return time.trim();
  };

  // Helper function to check employee availability status
  const getEmployeeAvailabilityStatus = (employee: Employee, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAssignments = assignments.filter(a => a.date === dateStr && a.employees && a.employees.includes(employee.name));

    if (employee.onLeave) {
      return {
        status: 'onLeave',
        text: t('employees.onLeave'),
        badgeColor: 'bg-gray-100 text-gray-800 border-gray-200'
      };
    }

    if (isEmployeeOnVacation(employee.id, date)) {
      return {
        status: 'onVacation',
        text: t('planner.onVacation'),
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    }

    if (dayAssignments.length === 0) {
      return {
        status: 'available',
        text: t('dashboard.available'),
        badgeColor: 'bg-green-100 text-green-800 border-green-200'
      };
    }

    // Check if fully booked
    const dayOfWeek = date.getDay();
    const workdayEnd = dayOfWeek === 5 ? "15:30" : "16:00";
    
    const hasEndTimeAtWorkdayEnd = dayAssignments.some(assignment => {
      const normalizedEndTime = normalizeTime(assignment.toTime);
      return normalizedEndTime === workdayEnd;
    });

    if (hasEndTimeAtWorkdayEnd) {
      return {
        status: 'fullyBooked',
        text: t('employees.fullyBooked'),
        badgeColor: 'bg-red-100 text-red-800 border-red-200'
      };
    }

    // Partially booked - show latest end time
    let latestEndTime = "00:00";
    dayAssignments.forEach(assignment => {
      const normalizedTime = normalizeTime(assignment.toTime);
      if (normalizedTime > latestEndTime) {
        latestEndTime = normalizedTime;
      }
    });

    return {
      status: 'partiallyBooked',
      text: t('employees.availableAfter', { time: latestEndTime.substring(0, 5) }),
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
  };

  const getUnassignedEmployees = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAssignments = assignments.filter(a => a.date === dateStr);
    const assignedEmployeeNames = new Set(dayAssignments.flatMap(assignment => assignment.employees || []));
    
    return employees.filter(employee => 
      employee.role === 'servicemedarbejder' && 
      !assignedEmployeeNames.has(employee.name) && 
      !employee.onLeave && 
      !isEmployeeOnVacation(employee.id, date)
    );
  };

  const getUnassignedCars = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAssignments = assignments.filter(a => a.date === dateStr);
    const assignedCarIds = new Set(dayAssignments.map(assignment => assignment.car).filter(car => car).map(car => typeof car === 'string' ? car : car?.id).filter(Boolean));
    return cars.filter(car => car.is_available && !assignedCarIds.has(car.id));
  };

  // Get all employees with their status
  const getAllEmployeesWithStatus = (date: Date) => {
    return employees
      .filter(employee => employee.role === 'servicemedarbejder')
      .map(employee => ({
        employee,
        status: getEmployeeAvailabilityStatus(employee, date)
      }));
  };

  const unassignedEmployees = getUnassignedEmployees(selectedDate);
  const unassignedCars = getUnassignedCars(selectedDate);
  const allEmployeesWithStatus = getAllEmployeesWithStatus(selectedDate);

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const displayedEmployees = showAllEmployees ? allEmployeesWithStatus : allEmployeesWithStatus.slice(0, 6);
  const displayedCars = showAllCars ? unassignedCars : unassignedCars.slice(0, 3);

  return (
    <div className="border border-blue-200 rounded-lg p-4 mb-6 bg-polygon-light">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h5 className="font-semibold text-blue-800">
            {t('planner.unassignedResources')} ({unassignedEmployees.length + unassignedCars.length})
          </h5>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-blue-600 hover:text-blue-800">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                {t('planner.today')}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreviousDay}>
                ←
              </Button>
              <span className="px-3 py-1 bg-white rounded text-sm font-medium border">
                {formatDate(selectedDate)}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextDay}>
                →
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">{t('planner.employees')} ({allEmployeesWithStatus.length})</span>
              </div>
              <div className="space-y-1">
                {displayedEmployees.map(({ employee, status }) => (
                  <div key={employee.id} className="text-sm bg-white p-2 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{employee.name}</span>
                      <Badge className={`text-xs ${status.badgeColor}`}>
                        {status.text}
                      </Badge>
                    </div>
                  </div>
                ))}
                {allEmployeesWithStatus.length > 6 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllEmployees(!showAllEmployees)} className="text-sm text-blue-600 hover:text-blue-800 p-1 h-auto">
                    {showAllEmployees ? t('planner.showLess') : `+${allEmployeesWithStatus.length - 6} ${t('planner.showMore')}`}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">{t('planner.unassignedCars')} ({unassignedCars.length})</span>
              </div>
              {unassignedCars.length === 0 ? (
                <p className="text-sm text-gray-500">{t('planner.allCarsAssigned')}</p>
              ) : (
                <div className="space-y-1">
                  {displayedCars.map(car => (
                    <div key={car.id} className="text-sm bg-white p-2 rounded border">
                      {car.car_number} - {car.name}
                    </div>
                  ))}
                  {unassignedCars.length > 3 && (
                    <Button variant="ghost" size="sm" onClick={() => setShowAllCars(!showAllCars)} className="text-sm text-blue-600 hover:text-blue-800 p-1 h-auto">
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
