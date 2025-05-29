
import React from 'react';
import { Car } from '@/types/car';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';

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
    
    const hasEndTimeAtSixteen = carAssignments.some(assignment => assignment.toTime === "16:00");
    
    return { 
      isAssigned: carAssignments.length > 0, 
      hasEndTimeAtSixteen 
    };
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {/* No car option */}
      <div
        onClick={() => onCarSelect('none')}
        className={`
          p-2 rounded-md border cursor-pointer transition-colors
          ${selectedCarId === 'none' ? 'bg-polygon-purple text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}
        `}
      >
        <span>{t('cars.noCar')}</span>
      </div>
      
      {cars.map(car => {
        const isSelected = selectedCarId === car.id;
        const isUnavailable = !car.is_available;
        const carUsage = isCarInUse(car.id);
        
        const isDisabled = isUnavailable;
        
        return (
          <div
            key={car.id}
            onClick={() => !isDisabled && onCarSelect(car.id)}
            className={`
              p-2 rounded-md border cursor-pointer transition-colors
              ${isSelected ? 'bg-polygon-purple text-white' : 'bg-white text-gray-700'}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
            `}
          >
            <div className="flex items-center gap-2">
              <span>{car.name}</span>
              {isUnavailable && <Badge variant="outline">{t('cars.unavailable')}</Badge>}
              {carUsage.isAssigned && !isDisabled && (
                <Badge className={`${carUsage.hasEndTimeAtSixteen ? 'bg-red-600 text-white border-red-700' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                  {t('cars.inUse')}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CarSelector;
