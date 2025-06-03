
import React from 'react';
import { Car, Edit, Trash2, Check, X, ToggleLeft, ToggleRight, Info } from 'lucide-react';
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
  onToggleAvailability: (car: CarData) => void;
}

const MobileCarCard: React.FC<MobileCarCardProps> = ({
  car,
  canViewFuelCardCode,
  isAdmin,
  onEdit,
  onDelete,
  onToggleAvailability
}) => {
  const { t } = useTranslation();
  
  return (
    <Card className="overflow-hidden border-gray-100 hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mr-3">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{car.car_number}</h3>
              <p className="text-sm text-gray-600">{car.name}</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleAvailability(car)}
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">
                      {car.is_available ? t('cars.markUnavailable') : t('cars.markAvailable')}
                    </span>
                    {car.is_available ? (
                      <ToggleRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {car.is_available ? t('cars.markUnavailable') : t('cars.markAvailable')}
                  </p>
                </TooltipContent>
              </Tooltip>

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
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
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
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">{t('cars.numberPlate')}</p>
              <p className="text-gray-900 font-medium">{car.number_plate}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">{t('cars.hasTrailerHitch')}</p>
              <div className="flex items-center">
                {car.has_trailer_hitch ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    <span className="text-gray-900">{t('common.yes')}</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="text-gray-600">{t('common.no')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {canViewFuelCardCode && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">{t('cars.fuelCardCode')}</p>
              <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">{car.fuel_card_code}</code>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {car.is_available ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-900">{t('common.available')}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-900">{t('common.unavailable')}</span>
                </>
              )}
            </div>
            {car.notes && car.notes.trim() !== '' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-blue-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs whitespace-pre-wrap">{car.notes}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileCarCard;
