
import React from 'react';
import { CarData } from './types';
import { TooltipProvider } from "@/components/ui/tooltip";
import MobileCarCard from './MobileCarCard';
import CarsTable from './CarsTable';
import { Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

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
  const { t } = useTranslation();
  // Sort cars by car_number
  const sortedCars = [...cars].sort((a, b) => a.car_number.localeCompare(b.car_number));

  if (sortedCars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Car className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">{t('cars.noCarsInSubDepartment')}</p>
      </div>
    );
  }
  
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
