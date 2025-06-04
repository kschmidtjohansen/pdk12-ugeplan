
import React from 'react';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { getCarIds } from '@/utils/carUtils';

interface UnassignedResourcesSectionProps {
  cars: Car[];
  employees: Employee[];
  assignments: Assignment[];
  selectedDate: string;
}

const UnassignedResourcesSection: React.FC<UnassignedResourcesSectionProps> = ({
  cars,
  employees,
  assignments,
  selectedDate
}) => {
  // Find cars that are not assigned on the selected date
  const unassignedCars = cars.filter(car => {
    const isAssigned = assignments.some(assignment => {
      if (assignment.date !== selectedDate) return false;
      const carIds = getCarIds(assignment.car);
      return carIds.includes(car.id);
    });
    return !isAssigned && car.is_available;
  });

  // Find employees that are not assigned on the selected date
  const unassignedEmployees = employees.filter(employee => {
    const isAssigned = assignments.some(assignment => {
      if (assignment.date !== selectedDate) return false;
      return assignment.employees?.includes(employee.name);
    });
    return !isAssigned && !employee.onLeave;
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Unassigned Resources</h3>
      
      {/* Unassigned Cars */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Cars</h4>
        <div className="flex flex-wrap gap-2">
          {unassignedCars.map(car => (
            <span
              key={car.id}
              className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
            >
              {car.name}
            </span>
          ))}
          {unassignedCars.length === 0 && (
            <span className="text-sm text-gray-500">All cars are assigned</span>
          )}
        </div>
      </div>

      {/* Unassigned Employees */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Employees</h4>
        <div className="flex flex-wrap gap-2">
          {unassignedEmployees.map(employee => (
            <span
              key={employee.id}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
            >
              {employee.name}
            </span>
          ))}
          {unassignedEmployees.length === 0 && (
            <span className="text-sm text-gray-500">All employees are assigned</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnassignedResourcesSection;
