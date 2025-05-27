
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

  const formatDate = (date: Date) => {
    const locale = currentLanguage === 'da' ? da : undefined;
    return format(date, 'PPP', { locale });
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

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-blue-800">
            Unassigned Resources ({unassignedEmployees.length + unassignedCars.length})
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
                Today
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
                <span className="font-medium text-sm">Employees ({unassignedEmployees.length})</span>
              </div>
              {unassignedEmployees.length === 0 ? (
                <p className="text-xs text-gray-500">All employees assigned</p>
              ) : (
                <div className="space-y-1">
                  {unassignedEmployees.slice(0, 3).map(employee => (
                    <div key={employee.id} className="text-xs bg-white p-2 rounded border">
                      {employee.name}
                    </div>
                  ))}
                  {unassignedEmployees.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{unassignedEmployees.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Cars ({unassignedCars.length})</span>
              </div>
              {unassignedCars.length === 0 ? (
                <p className="text-xs text-gray-500">All cars assigned</p>
              ) : (
                <div className="space-y-1">
                  {unassignedCars.slice(0, 3).map(car => (
                    <div key={car.id} className="text-xs bg-white p-2 rounded border">
                      {car.car_number} - {car.name}
                    </div>
                  ))}
                  {unassignedCars.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{unassignedCars.length - 3} more
                    </div>
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
