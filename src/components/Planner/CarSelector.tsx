
import React from 'react';
import { Car } from '@/types/car';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

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

  // Check if a car is in use with consistent date parsing
  const isCarInUse = (carId: string): { isAssigned: boolean; hasEndTimeAtSixteen: boolean; latestEndTime: string } => {
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
      const isAssigned = assignment.car && (
        typeof assignment.car === 'string' ? assignment.car === carId : assignment.car.id === carId
      );
      
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
    
    // Check for 16:00 end time
    const hasEndTimeAtSixteen = carAssignments.some(assignment => {
      const normalizedEndTime = normalizeTime(assignment.toTime);
      return normalizedEndTime === "16:00";
    });
    
    return { 
      isAssigned: carAssignments.length > 0, 
      hasEndTimeAtSixteen,
      latestEndTime
    };
  };

  // Get display text for selected car
  const getSelectedCarDisplay = () => {
    if (!selectedCarId || selectedCarId === '') {
      return t('planner.selectCar');
    }
    
    const car = cars.find(car => car.id === selectedCarId);
    return car ? car.name : t('planner.selectCar');
  };

  // Handle car selection
  const handleCarSelect = (value: string) => {
    if (value === 'none') {
      onCarSelect('');
    } else {
      onCarSelect(value);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{t('planner.selectCar')}</Label>
      <Select value={selectedCarId || 'none'} onValueChange={handleCarSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('planner.selectCar')} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {/* No car option */}
          <SelectItem value="none">
            {t('cars.noCar')}
          </SelectItem>
          
          {cars.map(car => {
            const isUnavailable = !car.is_available;
            const carUsage = isCarInUse(car.id);
            const hasRedStyling = carUsage.hasEndTimeAtSixteen;
            
            return (
              <SelectItem 
                key={car.id} 
                value={car.id}
                disabled={isUnavailable}
                className={hasRedStyling ? 'bg-red-50 text-red-700 font-bold border-l-4 border-red-600' : ''}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={hasRedStyling ? 'text-red-700 font-bold' : ''}>
                    {car.name}
                  </span>
                  <div className="flex gap-1 ml-2">
                    {isUnavailable && (
                      <Badge variant="outline" className="text-xs">
                        Unavailable
                      </Badge>
                    )}
                    {carUsage.isAssigned && !isUnavailable && (
                      <Badge 
                        className={`text-xs font-medium ${
                          hasRedStyling 
                            ? 'bg-red-600 text-white border-red-700' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        In use until {carUsage.latestEndTime}
                      </Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {/* Display selected car as removable chip */}
      {selectedCarId && selectedCarId !== '' && (
        <div className="flex flex-wrap gap-1">
          {(() => {
            const car = cars.find(c => c.id === selectedCarId);
            if (!car) return null;
            
            return (
              <Badge key={selectedCarId} variant="secondary" className="flex items-center gap-1">
                {car.name}
                <button
                  onClick={() => onCarSelect('')}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
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
