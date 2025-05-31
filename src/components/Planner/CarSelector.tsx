
import React from 'react';
import { Car } from '@/types/car';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  // ENHANCED: Improved time normalization function
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
    
    // Handle edge cases
    return time.trim();
  };

  // ENHANCED: Much improved function to check if a car is in use on the current date
  const isCarInUse = (carId: string): { isAssigned: boolean; hasEndTimeAtSixteen: boolean } => {
    const currentDateObj = new Date(currentDate);
    currentDateObj.setHours(0, 0, 0, 0);
    
    const carAssignments = assignments.filter(assignment => {
      if (currentAssignmentId && assignment.id === currentAssignmentId) {
        return false; // Exclude current assignment being edited
      }
      
      const assignmentDateObj = new Date(assignment.date);
      assignmentDateObj.setHours(0, 0, 0, 0);
      
      const isOnDate = assignmentDateObj.getTime() === currentDateObj.getTime();
      const isAssigned = assignment.car && (
        typeof assignment.car === 'string' ? assignment.car === carId : assignment.car.id === carId
      );
      
      return isOnDate && isAssigned;
    });
    
    console.log(`[CarSelector] Car ${carId} assignments on ${currentDate}:`, carAssignments);
    
    // ENHANCED: Much better 16:00 end time detection with robust normalization
    const hasEndTimeAtSixteen = carAssignments.some(assignment => {
      const originalTime = assignment.toTime;
      const normalizedEndTime = normalizeTime(originalTime);
      const exactMatch = normalizedEndTime === "16:00";
      
      console.log(`[CarSelector] Assignment ${assignment.id} for car ${carId}:`);
      console.log(`  - Original time: "${originalTime}"`);
      console.log(`  - Normalized time: "${normalizedEndTime}"`);
      console.log(`  - Exact 16:00 match: ${exactMatch}`);
      
      return exactMatch;
    });
    
    console.log(`[CarSelector] Car ${carId} has 16:00 end time: ${hasEndTimeAtSixteen}`);
    
    return { 
      isAssigned: carAssignments.length > 0, 
      hasEndTimeAtSixteen 
    };
  };

  // Get selected car name for display
  const getSelectedCarName = () => {
    if (selectedCarId === 'none') return t('cars.noCar');
    const selectedCar = cars.find(car => car.id === selectedCarId);
    return selectedCar ? selectedCar.name : t('cars.selectCar');
  };

  return (
    <div className="space-y-2">
      <Select value={selectedCarId} onValueChange={onCarSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('cars.selectCar')}>
            {getSelectedCarName()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {/* No car option */}
          <SelectItem value="none">
            <span>{t('cars.noCar')}</span>
          </SelectItem>
          
          {cars.map(car => {
            const isUnavailable = !car.is_available;
            const carUsage = isCarInUse(car.id);
            
            // ENHANCED: Stronger red styling for 16:00 end times with higher CSS specificity
            const hasRedStyling = carUsage.hasEndTimeAtSixteen;
            console.log(`[CarSelector] Car ${car.name} red styling applied: ${hasRedStyling}`);
            
            return (
              <SelectItem 
                key={car.id} 
                value={car.id}
                disabled={isUnavailable}
                className={hasRedStyling ? '!bg-red-50 !border-l-4 !border-red-600 hover:!bg-red-100' : ''}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={hasRedStyling ? '!text-red-700 !font-bold' : ''}>
                    {car.name}
                  </span>
                  <div className="flex gap-1 ml-2">
                    {isUnavailable && (
                      <Badge variant="outline" className="text-xs">
                        {t('cars.unavailable')}
                      </Badge>
                    )}
                    {carUsage.isAssigned && !isUnavailable && (
                      <Badge 
                        className={`text-xs font-medium ${
                          hasRedStyling 
                            ? '!bg-red-600 !text-white !border-red-700 hover:!bg-red-700' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        {t('cars.inUse')}
                      </Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CarSelector;
