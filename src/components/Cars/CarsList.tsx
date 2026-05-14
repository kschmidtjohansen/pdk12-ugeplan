
import React, { useState, useEffect, useMemo } from 'react';
import { CarData } from './types';
import { TooltipProvider } from "@/components/ui/tooltip";
import MobileCarCard from './MobileCarCard';
import CarsTable from './CarsTable';
import { Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import SimplePagination from '@/components/shared/SimplePagination';

interface CarsListProps {
  cars: CarData[];
  canEdit: boolean;
  canViewFuelCardCode: boolean;
  isAdmin: boolean;
  onEdit: (car: CarData) => void;
  onDelete: (car: CarData) => void;
  onToggleAvailability: (car: CarData) => void;
}

const PAGE_SIZE = 25;

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
  const sortedCars = useMemo(
    () => [...cars].sort((a, b) => a.car_number.localeCompare(b.car_number)),
    [cars]
  );

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sortedCars.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [sortedCars.length]);

  const pagedCars = useMemo(
    () => sortedCars.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedCars, page]
  );

  if (sortedCars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Car className="h-12 w-12 text-muted-foreground/60 mb-4" />
        <p className="text-muted-foreground">{t('cars.noCarsInSubDepartment')}</p>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <div>
        {/* Mobile view - card based display */}
        <div className="md:hidden space-y-4">
          {pagedCars.map((car) => (
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
            cars={pagedCars}
            canViewFuelCardCode={canViewFuelCardCode}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleAvailability={onToggleAvailability}
          />
        </div>

        <SimplePagination
          page={page}
          totalPages={totalPages}
          totalItems={sortedCars.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </TooltipProvider>
  );
};

export default CarsList;
