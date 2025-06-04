
import React, { useState } from 'react';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { getCarIds } from '@/utils/carUtils';
import { useTranslation } from '@/context/TranslationContext';
import { ChevronDown, ChevronUp, Users, Car as CarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [showMoreEmployees, setShowMoreEmployees] = useState(false);
  const [showMoreCars, setShowMoreCars] = useState(false);

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

  const totalUnassigned = unassignedCars.length + unassignedEmployees.length;
  
  if (totalUnassigned === 0) {
    return null;
  }

  const displayedEmployees = showMoreEmployees ? unassignedEmployees : unassignedEmployees.slice(0, 3);
  const displayedCars = showMoreCars ? unassignedCars : unassignedCars.slice(0, 3);

  return (
    <div className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-auto p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <span className="font-medium">
                {t('cars.unassignedResources')} ({totalUnassigned})
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="bg-white border border-gray-200 rounded-b-lg p-4 space-y-4">
            {/* Unassigned Employees */}
            {unassignedEmployees.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('cars.serviceEmployees')} ({unassignedEmployees.length})
                </h4>
                <div className="space-y-2">
                  {displayedEmployees.map(employee => (
                    <div
                      key={employee.id}
                      className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded px-3 py-2"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {employee.name}
                    </div>
                  ))}
                  {unassignedEmployees.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMoreEmployees(!showMoreEmployees)}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                    >
                      {showMoreEmployees ? t('cars.showLess') : t('cars.showMore')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Unassigned Cars */}
            {unassignedCars.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <CarIcon className="h-4 w-4" />
                  {t('cars.unusedCars')} ({unassignedCars.length})
                </h4>
                <div className="space-y-2">
                  {displayedCars.map(car => (
                    <div
                      key={car.id}
                      className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 rounded px-3 py-2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {car.car_number} - {car.name}
                    </div>
                  ))}
                  {unassignedCars.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMoreCars(!showMoreCars)}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                    >
                      {showMoreCars ? t('cars.showLess') : t('cars.showMore')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default UnassignedResourcesSection;
