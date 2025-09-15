import React from 'react';
import { Car } from '@/types/car';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Label } from '@/components/ui/label';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CarSelectorProps {
  cars: Car[];
  selectedCarId: string;
  onCarSelect: (carId: string) => void;
  currentDate: string;
  assignments?: Assignment[];
  currentAssignmentId?: string;
}

export const CarSelector: React.FC<CarSelectorProps> = ({
  cars,
  selectedCarId,
  onCarSelect,
  currentDate,
  assignments = [],
  currentAssignmentId
}) => {
  const { t } = useTranslation();

  console.log('[CarSelector] Rendering with:', {
    selectedCarId,
    carsCount: cars.length,
    currentDate,
    currentAssignmentId,
    hasSelectedCar: selectedCarId && selectedCarId !== ''
  });

  // Improved time normalization function
  const normalizeTime = (time: string): string => {
    if (!time) return '';

    // Remove seconds if present (HH:MM:SS -> HH:MM)
    if (time.length === 8 && time.includes(':')) {
      time = time.substring(0, 5);
    }

    // Ensure we have HH:MM format
    if (time.length === 5 && time.includes(':')) {
      return time;
    }
    return time.trim();
  };

  // Check if a car is in use with working hours logic
  const isCarInUse = (carId: string): {
    isAssigned: boolean;
    hasEndTimeAtWorkingHours: boolean;
    latestEndTime: string;
    isFullDay: boolean;
  } => {
    // Convert currentDate to consistent YYYY-MM-DD format
    let targetDateStr: string;
    try {
      if (currentDate.includes('/')) {
        const [day, month, year] = currentDate.split('/');
        targetDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (currentDate.includes('T')) {
        targetDateStr = currentDate.split('T')[0];
      } else {
        targetDateStr = currentDate;
      }
    } catch (e) {
      console.error(`[CarSelector] Error parsing currentDate: ${currentDate}`, e);
      targetDateStr = new Date().toISOString().split('T')[0];
    }

    const carAssignments = assignments.filter(assignment => {
      if (currentAssignmentId && assignment.id === currentAssignmentId) {
        return false;
      }

      // Normalize assignment date to YYYY-MM-DD format
      let assignmentDateStr: string;
      try {
        if (assignment.date.includes('T')) {
          assignmentDateStr = assignment.date.split('T')[0];
        } else if (assignment.date.includes('/')) {
          const [day, month, year] = assignment.date.split('/');
          assignmentDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          assignmentDateStr = assignment.date;
        }
      } catch (e) {
        console.error(`[CarSelector] Error parsing assignment date: ${assignment.date}`, e);
        assignmentDateStr = assignment.date;
      }

      const isOnDate = assignmentDateStr === targetDateStr;
      const isAssigned = assignment.car && (typeof assignment.car === 'string' ? assignment.car === carId : assignment.car.id === carId);
      return isOnDate && isAssigned;
    });

    // Get the latest end time for this car
    let latestEndTime = "00:00";
    carAssignments.forEach(assignment => {
      const normalizedTime = normalizeTime(assignment.toTime);
      if (normalizedTime > latestEndTime) {
        latestEndTime = normalizedTime;
      }
    });

    // Determine working hours based on day of week
    const currentDateObj = new Date(targetDateStr);
    const dayOfWeek = currentDateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    const isFriday = dayOfWeek === 5;
    const workingHoursEnd = isFriday ? "15:30" : "16:00";

    // Check if car is used for full working day
    const hasEndTimeAtWorkingHours = carAssignments.some(assignment => {
      const normalizedEndTime = normalizeTime(assignment.toTime);
      return normalizedEndTime === workingHoursEnd;
    });

    const isFullDay = hasEndTimeAtWorkingHours;

    return {
      isAssigned: carAssignments.length > 0,
      hasEndTimeAtWorkingHours,
      latestEndTime,
      isFullDay
    };
  };

  // Get display text for selected car
  const getSelectedCarDisplay = () => {
    console.log('[CarSelector] Getting display text for car:', {
      selectedCarId,
      isEmpty: !selectedCarId || selectedCarId === '',
      carExists: cars.find(car => car.id === selectedCarId)
    });
    
    if (!selectedCarId || selectedCarId === '') {
      console.log('[CarSelector] No car selected, showing placeholder');
      return t('cars.noCar');
    }
    
    const car = cars.find(car => car.id === selectedCarId);
    const displayText = car ? car.name : t('cars.noCar');
    console.log('[CarSelector] Display text:', displayText);
    return displayText;
  };

  // Handle car selection with enhanced debugging
  const handleCarSelect = (carId: string) => {
    console.log('[CarSelector] ===== CAR SELECTION =====');
    console.log('[CarSelector] Car selection triggered:', {
      carId,
      isNone: carId === 'none',
      isEmpty: carId === '',
      previousSelection: selectedCarId
    });
    
    if (carId === 'none') {
      console.log('[CarSelector] Setting car to empty (no car selected)');
      onCarSelect('');
    } else {
      console.log('[CarSelector] Setting car to:', carId);
      onCarSelect(carId);
    }
    console.log('[CarSelector] ===== CAR SELECTION END =====');
  };

  // Handle car removal
  const handleCarRemove = () => {
    console.log('[CarSelector] ===== CAR REMOVAL =====');
    console.log('[CarSelector] Removing selected car');
    onCarSelect('');
    console.log('[CarSelector] ===== CAR REMOVAL END =====');
  };

  // Check if we have a selected car for display purposes
  const hasSelectedCar = selectedCarId && selectedCarId !== '';

  return (
    <div className="space-y-2">
      <Label>{t('planner.selectCar')}</Label>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between p-2">
            <span className={`truncate px-[15px] ${!hasSelectedCar ? 'text-muted-foreground' : ''}`}>
              {getSelectedCarDisplay()}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 z-[60] bg-white border shadow-lg" 
          sideOffset={4}
          onPointerDownOutside={(event) => {
            // Allow scrolling without closing the popover
            const target = event.target as Element;
            if (target.closest('[data-radix-popper-content-wrapper]')) {
              event.preventDefault();
            }
          }}
        >
          {/* Scrollable container with proper wheel event handling */}
          <div 
            className="max-h-60 overflow-y-auto"
            onWheel={(e) => {
              // Prevent event from bubbling up to prevent popover from closing
              e.stopPropagation();
            }}
          >
            <div className="p-2 space-y-1">
              {/* No car option - ENHANCED */}
              <div
                onClick={() => handleCarSelect('none')}
                className={`flex items-center justify-between w-full space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors ${
                  !hasSelectedCar ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <span className={`font-medium ${!hasSelectedCar ? 'text-blue-700' : ''}`}>
                  {t('cars.noCar')}
                </span>
                {!hasSelectedCar && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    {t('common.selected')}
                  </Badge>
                )}
              </div>
              
              {cars.filter(car => car.show_in_planner !== false).map(car => {
                const isSelected = selectedCarId === car.id;
                const isUnavailable = !car.is_available;
                const carUsage = isCarInUse(car.id);
                const hasRedStyling = carUsage.isFullDay;
                
                return (
                  <div
                    key={car.id}
                    onClick={() => !isUnavailable && handleCarSelect(car.id)}
                    className={`flex items-center justify-between w-full space-x-2 p-2 rounded-md transition-colors cursor-pointer ${
                      isUnavailable ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    } ${hasRedStyling ? '!bg-red-50 !border-l-4 !border-red-600 hover:!bg-red-100' : ''} ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <span className={`truncate ${
                      hasRedStyling ? 'text-red-700 font-bold' : 
                      isSelected ? 'text-blue-700 font-medium' : ''
                    }`}>
                      {car.name}
                    </span>
                    <div className="flex gap-1 flex-shrink-0">
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          {t('common.selected')}
                        </Badge>
                      )}
                      {isUnavailable && (
                        <Badge variant="outline" className="text-xs">
                          {t('cars.unavailable')}
                        </Badge>
                      )}
                      {carUsage.isAssigned && !isUnavailable && !isSelected && (
                        <Badge 
                          className={`text-xs font-medium ${
                            hasRedStyling 
                              ? 'bg-red-600 text-white border-red-700' 
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          {carUsage.isFullDay 
                            ? (t('cars.inUseFullDay') || 'I brug hele dagen')
                            : (t('cars.inUse', { time: carUsage.latestEndTime }) || `I brug til ${carUsage.latestEndTime}`)
                          }
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Display selected car as removable chip - ENHANCED */}
      {hasSelectedCar && (
        <div className="flex flex-wrap gap-1">
          {(() => {
            const car = cars.find(c => c.id === selectedCarId);
            if (!car) return null;
            
            return (
              <Badge key={selectedCarId} variant="secondary" className="flex items-center gap-1">
                {car.name}
                <button 
                  onClick={handleCarRemove} 
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                  type="button"
                  title={t('cars.removeCar')}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default CarSelector;
