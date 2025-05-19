
import React from 'react';
import { Car, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CarData } from './types';
import { useTranslation } from '@/context/TranslationContext';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface MobileCarCardProps {
  car: CarData;
  canViewFuelCardCode: boolean;
  isAdmin: boolean;
  onEdit: (car: CarData) => void;
  onDelete: (car: CarData) => void;
}

const MobileCarCard: React.FC<MobileCarCardProps> = ({
  car,
  canViewFuelCardCode,
  isAdmin,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center mb-2">
            <Car className="h-4 w-4 mr-2 text-polygon-blue" />
            <h3 className="font-medium">{car.car_number} - {car.name}</h3>
          </div>
          {isAdmin && (
            <div className="flex space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(car)}
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">{t('common.edit')}</span>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('common.edit')}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(car)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <span className="sr-only">{t('common.delete')}</span>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('common.delete')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">{t('cars.carNumber')}:</p>
            <p>{car.car_number}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('cars.numberPlate')}:</p>
            <p>{car.number_plate}</p>
          </div>
          {canViewFuelCardCode && (
            <div className="col-span-2">
              <p className="text-muted-foreground">{t('cars.fuelCardCode')}:</p>
              <code className="bg-gray-100 p-1 rounded">{car.fuel_card_code}</code>
            </div>
          )}
          <div className="col-span-1">
            <p className="text-muted-foreground">{t('cars.hasTrailerHitch')}:</p>
            <div className="flex items-center">
              {car.has_trailer_hitch ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  <span>{t('common.yes')}</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-1 text-red-500" />
                  <span>{t('common.no')}</span>
                </>
              )}
            </div>
          </div>
          <div className="col-span-1">
            <p className="text-muted-foreground">{t('cars.isAvailable')}:</p>
            <div className="flex items-center">
              {car.is_available ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  <span>{t('common.available')}</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-1 text-red-500" />
                  <span>{t('common.unavailable')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileCarCard;
