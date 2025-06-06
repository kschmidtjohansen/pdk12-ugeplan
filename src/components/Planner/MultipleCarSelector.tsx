
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    
    // Find the latest end time and format it to HH:MM
    let latestEndTime = '';
    carAssignments.forEach(assignment => {
      if (assignment.toTime > latestEndTime) {
        latestEndTime = assignment.toTime;
      }
    });
    
    return { 
      isAvailable: false, 
      endTime: latestEndTime ? latestEndTime.substring(0, 5) : undefined
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
        <PopoverContent className="w-80 p-0 z-[60] bg-white border shadow-lg" sideOffset={4}>
          {/* Header with padding */}
          <div className="p-3 pb-2 border-b border-gray-100">
            <h4 className="font-medium text-sm">{t('planner.selectCars')}</h4>
          </div>
          
          {/* Scrollable content area */}
          <div className="relative">
            <ScrollArea className="h-64 w-full">
              <div className="p-3 space-y-1">
                {cars.map((car) => {
                  const isSelected = selectedCarIds.includes(car.id);
                  const bookingStatus = getCarBookingStatus(car.id);
                  const isGenerallyAvailable = car.is_available;
                  const isBookingAvailable = bookingStatus.isAvailable;
                  const canSelect = isGenerallyAvailable && isBookingAvailable;
                  
                  return (
                    <div
                      key={car.id}
                      className={`flex items-center space-x-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200 ${
                        !canSelect && !isSelected ? 'opacity-60' : ''
                      }`}
                      onClick={() => (canSelect || isSelected) && onCarToggle(car.id)}
                    >
                      <input
                        type="checkbox"
                        id={`car-${car.id}`}
                        checked={isSelected}
                        onChange={() => (canSelect || isSelected) && onCarToggle(car.id)}
                        disabled={!canSelect && !isSelected}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`car-${car.id}`}
                        className={`flex-1 text-sm cursor-pointer ${
                          !canSelect && !isSelected ? 'text-gray-400' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Car className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium truncate">{car.name}</span>
                            {car.car_number && (
                              <span className="text-gray-500 text-xs">({car.car_number})</span>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            {!isGenerallyAvailable ? (
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                                {t('planner.unavailable')}
                              </Badge>
                            ) : canSelect ? (
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
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MultipleCarSelector;
