
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { format, addDays, subDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Car as CarType } from '@/types/car';

interface UnassignedResourcesWidgetProps {
  assignments: Assignment[];
  employees: Employee[];
  cars: CarType[];
}

const UnassignedResourcesWidget: React.FC<UnassignedResourcesWidgetProps> = ({
  assignments,
  employees,
  cars
}) => {
  const { t, currentLanguage } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date: Date) => {
    const locale = currentLanguage === 'da' ? da : undefined;
    return format(date, 'PPP', { locale });
  };

  const getUnassignedEmployees = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAssignments = assignments.filter(a => a.date === dateStr);
    
    // Get all assigned employee names for this date
    const assignedEmployeeNames = new Set(
      dayAssignments.flatMap(assignment => assignment.employees || [])
    );
    
    // Filter out admin and skadeleder users, and return only unassigned servicemedarbejdere
    return employees.filter(employee => 
      employee.role === 'servicemedarbejder' && 
      !assignedEmployeeNames.has(employee.name) &&
      !employee.onLeave
    );
  };

  const getUnassignedCars = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAssignments = assignments.filter(a => a.date === dateStr);
    
    // Get all assigned car IDs for this date
    const assignedCarIds = new Set(
      dayAssignments
        .map(assignment => assignment.car)
        .filter(car => car)
        .map(car => typeof car === 'string' ? car : car?.id)
        .filter(Boolean)
    );
    
    // Return only available cars that are not assigned
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
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Unassigned Resources
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
              {formatDate(selectedDate)}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Unassigned Employees */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-blue-600">
                Unassigned Employees ({unassignedEmployees.length})
              </h3>
            </div>
            {unassignedEmployees.length === 0 ? (
              <p className="text-gray-500 text-sm">All employees are assigned or on leave</p>
            ) : (
              <div className="space-y-2">
                {unassignedEmployees.map(employee => (
                  <div key={employee.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                    <span className="font-medium">{employee.name}</span>
                    <span className="text-sm text-gray-600">{employee.jobTitle}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unassigned Cars */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-green-600">
                Unassigned Cars ({unassignedCars.length})
              </h3>
            </div>
            {unassignedCars.length === 0 ? (
              <p className="text-gray-500 text-sm">All available cars are assigned</p>
            ) : (
              <div className="space-y-2">
                {unassignedCars.map(car => (
                  <div key={car.id} className="flex items-center justify-between p-2 bg-green-50 rounded border">
                    <span className="font-medium">{car.car_number} - {car.name}</span>
                    <span className="text-sm text-gray-600">{car.number_plate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnassignedResourcesWidget;
