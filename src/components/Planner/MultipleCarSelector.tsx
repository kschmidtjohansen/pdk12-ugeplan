
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { X, Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Car as CarType } from '../../types/car';
import { Assignment } from '../../types/assignment';

interface MultipleCarSelectorProps {
  cars: CarType[];
  selectedCarIds: string[];
  onCarToggle: (carId: string) => void;
  currentDate: string;
  assignments?: Assignment[];
  currentAssignmentId?: string;
}

const MultipleCarSelector: React.FC<MultipleCarSelectorProps> = ({
  cars,
  selectedCarIds,
  onCarToggle,
  currentDate,
  assignments = [],
  currentAssignmentId
}) => {
  const { t } = useTranslation();

  // Check if a car is available for the current date and time
  const isCarAvailable = (carId: string): boolean => {
    if (!currentDate) return true;
    
    // Filter out current assignment when checking availability
    const otherAssignments = currentAssignmentId 
      ? assignments.filter(a => a.id !== currentAssignmentId)
      : assignments;
    
    // Check if car is assigned to any other assignment on the same date
    const isCarBusy = otherAssignments.some(assignment => {
      if (assignment.date !== currentDate) return false;
      
      // Check both old car field and new cars array for compatibility
      const assignmentCarIds = assignment.cars || (assignment.car ? [typeof assignment.car === 'string' ? assignment.car : assignment.car.id] : []);
      return assignmentCarIds.includes(carId);
    });
    
    return !isCarBusy;
  };

  // Get selected cars for display
  const selectedCars = cars.filter(car => selectedCarIds.includes(car.id));

  // Count how many cars are selected
  const selectedCount = selectedCarIds.length;

  console.log('[MultipleCarSelector] Cars:', cars.length);
  console.log('[MultipleCarSelector] Selected car IDs:', selectedCarIds);
  console.log('[MultipleCarSelector] Current date:', currentDate);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('planner.cars')}</label>
      
      {/* Selected cars display */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCars.map((car) => (
            <Badge key={car.id} variant="secondary" className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              {car.name}
              <button
                type="button"
                onClick={() => onCarToggle(car.id)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Car selector dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <Car className="mr-2 h-4 w-4" />
            {selectedCount === 0 
              ? t('planner.selectCars')
              : t('planner.carsSelected', { count: selectedCount })
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <div className="p-3">
            <h4 className="font-medium mb-3">{t('planner.selectCars')}</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cars.map((car) => {
                const isSelected = selectedCarIds.includes(car.id);
                const isAvailable = car.is_available && isCarAvailable(car.id);
                
                return (
                  <div
                    key={car.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      id={`car-${car.id}`}
                      checked={isSelected}
                      onChange={() => onCarToggle(car.id)}
                      disabled={!isAvailable && !isSelected}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor={`car-${car.id}`}
                      className={`flex-1 text-sm cursor-pointer ${
                        !isAvailable && !isSelected ? 'text-gray-400' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        <span className="font-medium">{car.name}</span>
                        {car.car_number && (
                          <span className="text-gray-500">({car.car_number})</span>
                        )}
                      </div>
                      {!isAvailable && !isSelected && (
                        <div className="text-xs text-red-500 mt-1">
                          {t('planner.carNotAvailable')}
                        </div>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MultipleCarSelector;
