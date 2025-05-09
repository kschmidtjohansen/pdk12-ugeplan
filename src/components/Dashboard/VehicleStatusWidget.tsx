
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { Car } from '@/types/car';
import { Car as CarIcon, Check, X } from 'lucide-react';

interface VehicleStatusWidgetProps {
  availableVehicles: number;
  totalVehicles: number;
  cars?: Car[];
}

const VehicleStatusWidget: React.FC<VehicleStatusWidgetProps> = ({
  availableVehicles,
  totalVehicles,
  cars = []
}) => {
  const {
    t
  } = useTranslation();

  // Only use cars data if it's provided, otherwise use the counts directly
  const carsToDisplay = cars && cars.length > 0 
    ? cars.map(car => ({
        ...car,
        inUse: Math.random() > 0.5
      })).slice(0, 3) // Only show top 3 cars for the widget
    : Array.from({ length: Math.min(3, totalVehicles) }, (_, i) => ({
        id: `placeholder-${i}`,
        name: `Vehicle ${i + 1}`,
        inUse: i >= availableVehicles
      }));
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {t('dashboard.vehicleStatus')}
        </CardTitle>
        <CarIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {carsToDisplay.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No vehicles available
          </p>
        ) : (
          <div className="space-y-4">
            {carsToDisplay.map(car => (
              <div key={car.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-polygon-light flex items-center justify-center mr-3">
                    <CarIcon className="h-4 w-4 text-polygon-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{car.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {car.id.substring(0, 8)}</p>
                  </div>
                </div>
                <div>
                  {(car as any).inUse ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <X className="h-3 w-3 mr-1" /> {t('dashboard.inUse')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" /> {t('dashboard.available')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleStatusWidget;
