
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

  // Helper function to check if a car is in use on the current date
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
    
    // Check for 16:00 end time - this is the key fix
    const hasEndTimeAtSixteen = carAssignments.some(assignment => assignment.toTime === "16:00");
    console.log(`[CarSelector] Car ${carId} has 16:00 end time:`, hasEndTimeAtSixteen);
    
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
            
            // Enhanced red styling for 16:00 end times
            const hasRedStyling = carUsage.hasEndTimeAtSixteen;
            console.log(`[CarSelector] Car ${car.name} red styling:`, hasRedStyling);
            
            return (
              <SelectItem 
                key={car.id} 
                value={car.id}
                disabled={isUnavailable}
                className={hasRedStyling ? 'bg-red-50 border-l-4 border-red-600' : ''}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={hasRedStyling ? 'text-red-600 font-bold' : ''}>
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
                            ? 'bg-red-600 text-white border-red-700' 
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
