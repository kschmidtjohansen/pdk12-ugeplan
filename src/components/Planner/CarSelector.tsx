import React from 'react';
import { Car } from '@/types/car';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Label } from '@/components/ui/label';
import { X, ChevronDown, Car as CarIcon } from 'lucide-react';
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

  const normalizeTime = (time: string): string => {
    if (!time) return '';
    if (time.length === 8 && time.includes(':')) {
      time = time.substring(0, 5);
    }
    if (time.length === 5 && time.includes(':')) {
      return time;
    }
    return time.trim();
  };

  const isCarInUse = (carId: string): {
    isAssigned: boolean;
    hasEndTimeAtWorkingHours: boolean;
    latestEndTime: string;
    isFullDay: boolean;
  } => {
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
      targetDateStr = new Date().toISOString().split('T')[0];
    }

    const carAssignments = assignments.filter(assignment => {
      if (currentAssignmentId && assignment.id === currentAssignmentId) return false;

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
        assignmentDateStr = assignment.date;
      }

      const isOnDate = assignmentDateStr === targetDateStr;
      const isAssigned = assignment.car && (typeof assignment.car === 'string' ? assignment.car === carId : assignment.car.id === carId);
      return isOnDate && isAssigned;
    });

    let latestEndTime = "00:00";
    carAssignments.forEach(assignment => {
      const normalizedTime = normalizeTime(assignment.toTime);
      if (normalizedTime > latestEndTime) {
        latestEndTime = normalizedTime;
      }
    });

    const currentDateObj = new Date(targetDateStr);
    const dayOfWeek = currentDateObj.getDay();
    const isFriday = dayOfWeek === 5;
    const workingHoursEnd = isFriday ? "15:30" : "16:00";

    const hasEndTimeAtWorkingHours = carAssignments.some(assignment => {
      const normalizedEndTime = normalizeTime(assignment.toTime);
      return normalizedEndTime === workingHoursEnd;
    });

    const isFullDay = hasEndTimeAtWorkingHours;

    return { isAssigned: carAssignments.length > 0, hasEndTimeAtWorkingHours, latestEndTime, isFullDay };
  };

  const getSelectedCarDisplay = () => {
    if (!selectedCarId || selectedCarId === '') return t('cars.noCar');
    const car = cars.find(car => car.id === selectedCarId);
    return car ? car.name : t('cars.noCar');
  };

  const handleCarSelect = (carId: string) => {
    if (carId === 'none') {
      onCarSelect('');
    } else {
      onCarSelect(carId);
    }
  };

  const handleCarRemove = () => {
    onCarSelect('');
  };

  const hasSelectedCar = selectedCarId && selectedCarId !== '';

  return (
    <div className="space-y-2">
      <Label>{t('planner.selectCar')}</Label>
      
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between p-2">
            <span className={`truncate px-[15px] ${!hasSelectedCar ? 'text-muted-foreground' : ''}`}>
              {getSelectedCarDisplay()}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 z-[60] bg-popover border shadow-lg" 
          sideOffset={4}
          onPointerDownOutside={(event) => {
            const target = event.target as Element;
            if (target.closest('[data-radix-popper-content-wrapper]')) {
              event.preventDefault();
            }
          }}
        >
          <div 
            className="max-h-60 overflow-y-auto overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {/* No car option */}
              <div
                onClick={() => handleCarSelect('none')}
                className={`flex items-center gap-3 py-3 px-4 cursor-pointer transition-colors border-b border-border/40 ${
                  !hasSelectedCar ? 'bg-accent/30' : 'hover:bg-accent/50'
                }`}
              >
                <span className="font-medium text-foreground">
                  {t('cars.noCar')}
                </span>
              </div>
              
              {cars.filter(car => car.show_in_planner !== false).map((car, index, filteredCars) => {
                const isSelected = selectedCarId === car.id;
                const isUnavailable = !car.is_available;
                const carUsage = isCarInUse(car.id);
                
                return (
                  <div
                    key={car.id}
                    onClick={() => !isUnavailable && handleCarSelect(car.id)}
                    className={`flex items-center gap-3 py-3 px-4 transition-colors ${
                      index < filteredCars.length - 1 ? 'border-b border-border/40' : ''
                    } ${
                      isUnavailable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'
                    } ${
                      isSelected ? 'bg-accent/30' : ''
                    }`}
                  >
                    <CarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-foreground truncate">
                            {car.name}
                          </span>
                          {car.number_plate && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {car.number_plate}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-2">
                          {isUnavailable && (
                            <Badge variant="outline" size="sm">
                              {t('cars.unavailable')}
                            </Badge>
                          )}
                          {carUsage.isAssigned && !isUnavailable && (
                            <Badge 
                              variant={carUsage.isFullDay ? 'destructive' : 'warning'}
                              size="sm"
                            >
                              {carUsage.isFullDay 
                                ? (t('cars.inUseFullDay') || 'I brug hele dagen')
                                : (t('cars.inUse', { time: carUsage.latestEndTime }) || `I brug til ${carUsage.latestEndTime}`)
                              }
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
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
