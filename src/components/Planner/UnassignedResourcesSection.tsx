
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Users, Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { format, addDays, subDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Car as CarType } from '@/types/car';

interface UnassignedResourcesSectionProps {
  assignments: Assignment[];
  employees: Employee[];
  cars: CarType[];
}

const UnassignedResourcesSection: React.FC<UnassignedResourcesSectionProps> = ({
  assignments,
  employees,
  cars
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

  const getUnassignedEmployees = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAssignments = assignments.filter(a => a.date === dateStr);
    
    const assignedEmployeeNames = new Set(
      dayAssignments.flatMap(assignment => assignment.employees || [])
    );
    
    return employees.filter(employee => 
      employee.role === 'servicemedarbejder' && 
      !assignedEmployeeNames.has(employee.name) &&
      !employee.onLeave
    );
  };

  const getUnassignedCars = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAssignments = assignments.filter(a => a.date === dateStr);
    
    const assignedCarIds = new Set(
      dayAssignments
        .map(assignment => assignment.car)
        .filter(car => car)
        .map(car => typeof car === 'string' ? car : car?.id)
        .filter(Boolean)
    );
    
    return cars.filter(car => 
      car.is_available && 
      !assignedCarIds.has(car.id)
    );
  };

  const unassignedEmployees = getUnassignedEmployees(selectedDate);
  const unassignedCars = getUnassignedCars(selectedDate);

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const displayedEmployees = showAllEmployees ? unassignedEmployees : unassignedEmployees.slice(0, 3);
  const displayedCars = showAllCars ? unassignedCars : unassignedCars.slice(0, 3);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-blue-800">
            {t('planner.unassignedResources')} ({unassignedEmployees.length + unassignedCars.length})
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800"
        >
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
                <span className="font-medium text-sm">{t('planner.employees')} ({unassignedEmployees.length})</span>
              </div>
              {unassignedEmployees.length === 0 ? (
                <p className="text-xs text-gray-500">{t('planner.allEmployeesAssigned')}</p>
              ) : (
                <div className="space-y-1">
                  {displayedEmployees.map(employee => (
                    <div key={employee.id} className="text-xs bg-white p-2 rounded border">
                      {employee.name}
                    </div>
                  ))}
                  {unassignedEmployees.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllEmployees(!showAllEmployees)}
                      className="text-xs text-blue-600 hover:text-blue-800 p-1 h-auto"
                    >
                      {showAllEmployees 
                        ? t('planner.showLess')
                        : `+${unassignedEmployees.length - 3} ${t('planner.showMore')}`
                      }
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">{t('planner.unassignedCars')} ({unassignedCars.length})</span>
              </div>
              {unassignedCars.length === 0 ? (
                <p className="text-xs text-gray-500">{t('planner.allCarsAssigned')}</p>
              ) : (
                <div className="space-y-1">
                  {displayedCars.map(car => (
                    <div key={car.id} className="text-xs bg-white p-2 rounded border">
                      {car.car_number} - {car.name}
                    </div>
                  ))}
                  {unassignedCars.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllCars(!showAllCars)}
                      className="text-xs text-blue-600 hover:text-blue-800 p-1 h-auto"
                    >
                      {showAllCars 
                        ? t('planner.showLess')
                        : `+${unassignedCars.length - 3} ${t('planner.showMore')}`
                      }
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
