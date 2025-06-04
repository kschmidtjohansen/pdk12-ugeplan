
import React from 'react';
import { Car } from '@/types/car';
import { Assignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { Check, ChevronDown, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface CarSelectorProps {
  cars: Car[];
  selectedCarIds: string[];
  onCarSelect: (carIds: string[]) => void;
  currentDate: string;
  assignments?: Assignment[];
  currentAssignmentId?: string;
}

export const CarSelector: React.FC<CarSelectorProps> = ({
  cars,
  selectedCarIds,
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

  // COMPREHENSIVE FIX: Improved function to check if a car is in use with consistent date parsing
  const isCarInUse = (carId: string): { isAssigned: boolean; hasEndTimeAtSixteen: boolean; latestEndTime: string } => {
    // ROBUST date parsing - handle both YYYY-MM-DD and DD/MM/YYYY formats
    let targetDateStr: string;
    try {
      // Convert currentDate to consistent YYYY-MM-DD format
      if (currentDate.includes('/')) {
        // Handle DD/MM/YYYY format
        const [day, month, year] = currentDate.split('/');
        targetDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (currentDate.includes('T')) {
        // Handle ISO datetime format
        targetDateStr = currentDate.split('T')[0];
      } else {
        // Assume YYYY-MM-DD format
        targetDateStr = currentDate;
      }
      
      console.log(`[CarSelector] Date conversion: "${currentDate}" -> "${targetDateStr}"`);
    } catch (e) {
      console.error(`[CarSelector] Error parsing currentDate: ${currentDate}`, e);
      targetDateStr = new Date().toISOString().split('T')[0]; // Fallback to today
    }
    
    const carAssignments = assignments.filter(assignment => {
      if (currentAssignmentId && assignment.id === currentAssignmentId) {
        return false; // Exclude current assignment being edited
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
      
      console.log(`[CarSelector] Assignment ${assignment.id} for car ${carId}:`);
      console.log(`  - Assignment date: "${assignment.date}" -> normalized: "${assignmentDateStr}"`);
      console.log(`  - Target date: "${targetDateStr}"`);
      console.log(`  - Date match: ${isOnDate}`);
      console.log(`  - Car assigned: ${isAssigned}`);
      
      return isOnDate && isAssigned;
    });
    
    console.log(`[CarSelector] Car ${carId} assignments on ${targetDateStr}:`, carAssignments);
    
    // Get the latest end time for this car
    let latestEndTime = "00:00";
    carAssignments.forEach(assignment => {
      const normalizedTime = normalizeTime(assignment.toTime);
      if (normalizedTime > latestEndTime) {
        latestEndTime = normalizedTime;
      }
    });
    
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
    console.log(`[CarSelector] Car ${carId} latest end time: ${latestEndTime}`);
    
    return { 
      isAssigned: carAssignments.length > 0, 
      hasEndTimeAtSixteen,
      latestEndTime
    };
  };

  // Handle car selection/deselection
  const handleCarToggle = (carId: string, checked: boolean) => {
    if (carId === 'none') {
      // If "No car" is selected, clear all other selections
      onCarSelect(checked ? ['none'] : []);
    } else {
      let newSelectedIds = [...selectedCarIds];
      
      // Remove "none" if selecting actual cars
      newSelectedIds = newSelectedIds.filter(id => id !== 'none');
      
      if (checked) {
        // Add car if not already selected
        if (!newSelectedIds.includes(carId)) {
          newSelectedIds.push(carId);
        }
      } else {
        // Remove car from selection
        newSelectedIds = newSelectedIds.filter(id => id !== carId);
      }
      
      onCarSelect(newSelectedIds);
    }
  };

  // Remove a specific car from selection
  const removeCar = (carId: string) => {
    const newSelectedIds = selectedCarIds.filter(id => id !== carId);
    onCarSelect(newSelectedIds);
  };

  // Get display text for selected cars
  const getSelectedCarsDisplay = () => {
    if (selectedCarIds.length === 0) {
      return t('cars.selectCar');
    }
    
    if (selectedCarIds.includes('none')) {
      return t('cars.noCar');
    }
    
    if (selectedCarIds.length === 1) {
      const car = cars.find(car => car.id === selectedCarIds[0]);
      return car ? car.name : t('cars.selectCar');
    }
    
    return `${selectedCarIds.length} ${t('cars.carsSelected', 'cars selected')}`;
  };

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
          >
            {getSelectedCarsDisplay()}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="max-h-60 overflow-auto">
            {/* No car option */}
            <div className="flex items-center space-x-2 p-2 hover:bg-accent">
              <Checkbox
                id="none"
                checked={selectedCarIds.includes('none')}
                onCheckedChange={(checked) => handleCarToggle('none', checked as boolean)}
              />
              <label htmlFor="none" className="flex-1 cursor-pointer">
                {t('cars.noCar')}
              </label>
            </div>
            
            {cars.map(car => {
              const isUnavailable = !car.is_available;
              const carUsage = isCarInUse(car.id);
              const isSelected = selectedCarIds.includes(car.id);
              
              // ENHANCED: Stronger red styling for 16:00 end times with higher CSS specificity
              const hasRedStyling = carUsage.hasEndTimeAtSixteen;
              console.log(`[CarSelector] Car ${car.name} red styling applied: ${hasRedStyling}`);
              
              return (
                <div 
                  key={car.id}
                  className={`flex items-center space-x-2 p-2 hover:bg-accent ${
                    hasRedStyling ? '!bg-red-50 !border-l-4 !border-red-600' : ''
                  } ${isUnavailable ? 'opacity-50' : ''}`}
                >
                  <Checkbox
                    id={car.id}
                    checked={isSelected}
                    disabled={isUnavailable}
                    onCheckedChange={(checked) => handleCarToggle(car.id, checked as boolean)}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <label 
                      htmlFor={car.id} 
                      className={`cursor-pointer ${hasRedStyling ? '!text-red-700 !font-bold' : ''} ${
                        isUnavailable ? 'cursor-not-allowed' : ''
                      }`}
                    >
                      {car.name}
                    </label>
                    <div className="flex gap-1">
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
                          {t('cars.inUse', { time: carUsage.latestEndTime })}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Display selected cars as removable chips */}
      {selectedCarIds.length > 0 && !selectedCarIds.includes('none') && (
        <div className="flex flex-wrap gap-1">
          {selectedCarIds.map(carId => {
            const car = cars.find(c => c.id === carId);
            if (!car) return null;
            
            return (
              <Badge key={carId} variant="secondary" className="flex items-center gap-1">
                {car.name}
                <button
                  onClick={() => removeCar(carId)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CarSelector;
