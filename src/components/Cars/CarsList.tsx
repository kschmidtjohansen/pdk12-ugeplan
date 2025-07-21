
import React from 'react';
import { CarData } from './types';
import { TooltipProvider } from "@/components/ui/tooltip";
import MobileCarCard from './MobileCarCard';
import CarsTable from './CarsTable';

interface CarsListProps {
  cars: CarData[];
  canEdit: boolean;
  canViewFuelCardCode: boolean;
  isAdmin: boolean;
  onEdit: (car: CarData) => void;
  onDelete: (car: CarData) => void;
  onToggleAvailability: (car: CarData) => void;
}

const CarsList: React.FC<CarsListProps> = ({
  cars,
  canEdit,
  canViewFuelCardCode,
  isAdmin,
  onEdit,
  onDelete,
  onToggleAvailability
}) => {
  // Sort cars by car_number
  const sortedCars = [...cars].sort((a, b) => a.car_number.localeCompare(b.car_number));
  
  return (
    <TooltipProvider>
      <div>
        {/* Mobile view - card based display */}
        <div className="md:hidden space-y-4">
          {sortedCars.map((car) => (
            <MobileCarCard 
              key={car.id}
              car={car}
              canViewFuelCardCode={canViewFuelCardCode}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleAvailability={onToggleAvailability}
            />
          ))}
        </div>

        {/* Desktop view - table based display */}
        <div className="hidden md:block">
          <CarsTable
            cars={sortedCars}
            canViewFuelCardCode={canViewFuelCardCode}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleAvailability={onToggleAvailability}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CarsList;
