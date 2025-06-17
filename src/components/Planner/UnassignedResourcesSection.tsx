
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
    console.log(`[UnassignedResourcesSection] === CALCULATING AVAILABLE EMPLOYEES FOR DATE: ${dateStr} ===`);
    console.log(`[UnassignedResourcesSection] Total employees: ${employees.length}`);
    console.log(`[UnassignedResourcesSection] Total assignments: ${assignments.length}`);
    console.log(`[UnassignedResourcesSection] Total vacations: ${vacations.length}`);
    
    // Filter to service employees only
    const serviceEmployees = employees.filter(employee => {
      const isService = employee.role === 'servicemedarbejder';
      console.log(`[UnassignedResourcesSection] Employee ${employee.name}: role=${employee.role}, isService=${isService}`);
      return isService;
    });
    
    console.log(`[UnassignedResourcesSection] Service employees: ${serviceEmployees.length}`);
    
    const availableEmployeesWithStatus = serviceEmployees
      .map(employee => {
        console.log(`[UnassignedResourcesSection] === Checking availability for ${employee.name} ===`);
        
        const status = getEmployeeAvailabilityStatus(employee, date, assignments, vacations, t);
        
        console.log(`[UnassignedResourcesSection] Employee ${employee.name}: status=${status.status}, statusText="${status.statusText}"`);
        
        return {
          employee,
          status
        };
      })
      .filter(({ status }) => {
        const isAvailable = status.status === 'available' || status.status === 'partiallyBooked';
        console.log(`[UnassignedResourcesSection] Status ${status.status} -> isAvailable: ${isAvailable}`);
        return isAvailable;
      });
      
    console.log(`[UnassignedResourcesSection] === FINAL AVAILABLE EMPLOYEES: ${availableEmployeesWithStatus.length} ===`);
    availableEmployeesWithStatus.forEach(({ employee, status }) => {
      console.log(`  - ${employee.name}: ${status.status}`);
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
    <div className="border border-blue-200 rounded-lg p-4 mb-6 bg-polygon-light">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h5 className="font-semibold text-blue-800">
            {t('planner.unassignedResources')} ({availableEmployeesWithStatus.length + unassignedCars.length})
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
                <span className="font-medium text-sm">{t('planner.employees')} ({availableEmployeesWithStatus.length})</span>
              </div>
              <div className="space-y-1">
                {displayedEmployees.map(({ employee, status }) => (
                  <div key={employee.id} className="text-sm bg-white p-2 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{employee.name}</span>
                      <Badge className={`text-xs ${status.badgeColor}`}>
                        {status.statusText}
                      </Badge>
                    </div>
                  </div>
                ))}
                {availableEmployeesWithStatus.length > 6 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllEmployees(!showAllEmployees)} className="text-sm text-blue-600 hover:text-blue-800 p-1 h-auto">
                    {showAllEmployees ? t('planner.showLess') : `+${availableEmployeesWithStatus.length - 6} ${t('planner.showMore')}`}
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
