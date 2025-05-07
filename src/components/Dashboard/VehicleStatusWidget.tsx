
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { Car } from '@/types/car';
import { Car as CarIcon, Check, X } from 'lucide-react';

interface VehicleStatusWidgetProps {
  cars: Car[];
}

const VehicleStatusWidget: React.FC<VehicleStatusWidgetProps> = ({
  cars
}) => {
  const { t } = useTranslation();
  
  // For demo purposes, let's randomly mark some vehicles as in use
  const carsWithStatus = cars.map(car => ({
    ...car,
    inUse: Math.random() > 0.5
  }));
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{t('dashboard.vehicleStatus')}</CardTitle>
        <CarIcon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {carsWithStatus.slice(0, 4).map((car) => (
            <div key={car.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <CarIcon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium">{car.name}</p>
              </div>
              <div>
                {car.inUse ? (
                  <div className="flex items-center text-red-500">
                    <X className="mr-1 h-4 w-4" />
                    <span className="text-xs">{t('dashboard.inUse')}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-500">
                    <Check className="mr-1 h-4 w-4" />
                    <span className="text-xs">{t('dashboard.available')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleStatusWidget;
