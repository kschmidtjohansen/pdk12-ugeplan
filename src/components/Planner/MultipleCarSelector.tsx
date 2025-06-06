
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
  const getCarBookingStatus = (carId: string): { isAvailable: boolean; endTime?: string } => {
    if (!currentDate) return { isAvailable: true };
    
    // Filter out current assignment when checking availability
    const otherAssignments = currentAssignmentId 
      ? assignments.filter(a => a.id !== currentAssignmentId)
      : assignments;
    
    // Check if car is assigned to any other assignment on the same date
    const carAssignments = otherAssignments.filter(assignment => {
      if (assignment.date !== currentDate) return false;
      
      // Check both old car field and new cars array for compatibility
      const assignmentCarIds = assignment.cars || (assignment.car ? [typeof assignment.car === 'string' ? assignment.car : assignment.car.id] : []);
      return assignmentCarIds.includes(carId);
    });
    
    if (carAssignments.length === 0) {
      return { isAvailable: true };
    }
    
    // Find the latest end time
    let latestEndTime = '';
    carAssignments.forEach(assignment => {
      if (assignment.toTime > latestEndTime) {
        latestEndTime = assignment.toTime;
      }
    });
    
    return { 
      isAvailable: false, 
      endTime: latestEndTime 
    };
  };

  // Get selected cars for display
  const selectedCars = cars.filter(car => selectedCarIds.includes(car.id));

  // Count how many cars are selected
  const selectedCount = selectedCarIds.length;

  // Get button display text
  const getButtonText = () => {
    if (selectedCount === 0) {
      return t('planner.selectCars');
    } else if (selectedCount === 1) {
      return selectedCars[0]?.name || t('planner.selectCars');
    } else {
      return t('planner.carsSelected', { count: selectedCount });
    }
  };

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
            className="w-full justify-between h-11 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span>{getButtonText()}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 z-50 bg-white border shadow-md">
          <div className="p-3">
            <h4 className="font-medium mb-3">{t('planner.selectCars')}</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cars.map((car) => {
                const isSelected = selectedCarIds.includes(car.id);
                const bookingStatus = getCarBookingStatus(car.id);
                const isAvailable = car.is_available && bookingStatus.isAvailable;
                
                return (
                  <div
                    key={car.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => (isAvailable || isSelected) && onCarToggle(car.id)}
                  >
                    <input
                      type="checkbox"
                      id={`car-${car.id}`}
                      checked={isSelected}
                      onChange={() => (isAvailable || isSelected) && onCarToggle(car.id)}
                      disabled={!isAvailable && !isSelected}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor={`car-${car.id}`}
                      className={`flex-1 text-sm cursor-pointer ${
                        !isAvailable && !isSelected ? 'text-gray-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          <span className="font-medium">{car.name}</span>
                          {car.car_number && (
                            <span className="text-gray-500">({car.car_number})</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {isAvailable ? (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {t('planner.available')}
                            </Badge>
                          ) : !isSelected && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                              {bookingStatus.endTime 
                                ? t('planner.bookedUntil', { time: bookingStatus.endTime })
                                : t('planner.carNotAvailable')
                              }
                            </Badge>
                          )}
                        </div>
                      </div>
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
