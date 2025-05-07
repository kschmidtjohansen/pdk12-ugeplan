
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useCars } from '@/hooks/useCars';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { format } from 'date-fns';

const VehicleStatus: React.FC = () => {
  const { t } = useTranslation();
  const { cars } = useCars();
  const { assignments } = usePlannerAssignments();
  
  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Find cars that are in use today
  const activeCars = new Set(
    assignments
      .filter(assignment => assignment.date === today)
      .map(assignment => assignment.car)
  );
  
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          {t('dashboard.vehicleStatus')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cars.map((car) => {
            const isActive = activeCars.has(car.name);
            
            return (
              <div key={car.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{car.name}</p>
                  <p className="text-sm text-muted-foreground">{car.numberPlate}</p>
                </div>
                <div className={`flex items-center gap-2 rounded px-2 py-1 ${
                  isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    isActive ? 'bg-green-500' : 'bg-gray-500'
                  }`}></span>
                  <span className="text-xs font-medium">
                    {isActive ? t('dashboard.inUse') : t('dashboard.available')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleStatus;
