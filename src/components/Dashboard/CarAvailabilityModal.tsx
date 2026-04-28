
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Car } from '@/types/car';

interface CarAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: Car[];
  title: string;
  /** ISO yyyy-MM-dd context, currently informational. */
  selectedDate?: string;
}

const CarAvailabilityModal: React.FC<CarAvailabilityModalProps> = ({
  isOpen,
  onClose,
  cars,
  title,
  selectedDate,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>{title}</span>
            {selectedDate && (
              <Badge variant="default" size="sm" className="font-normal">
                {new Date(selectedDate).toLocaleDateString()}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {cars.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              {t('cars.noCars')}
            </p>
          ) : (
            cars.map((car) => (
              <div key={car.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{car.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.metrics.carNumber', { number: car.car_number })}
                  </p>
                  <p className="text-xs text-muted-foreground">{car.number_plate}</p>
                  {car.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{car.notes}</p>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <Badge 
                    className="bg-green-100 text-green-800 border-green-200 text-xs"
                    variant="outline"
                  >
                    {t('common.available')}
                  </Badge>
                  
                  {car.has_trailer_hitch && (
                    <span className="text-xs text-muted-foreground">
                      {t('dashboard.metrics.hasTrailerHitch')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarAvailabilityModal;
