
import React, { useState } from 'react';
import { Car, Edit, Trash2, Check, X, ToggleLeft, ToggleRight, Info, Truck, Recycle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);

  const hasDetails = car.has_trailer_hitch && (car.towing_capacity_with_brakes || car.towing_capacity_without_brakes || car.total_weight) || (car.notes && car.notes.trim() !== '');
  
  return (
    <Card className="overflow-hidden border-border hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div 
            className={`flex items-center flex-1 ${hasDetails ? 'cursor-pointer' : ''}`}
            onClick={() => hasDetails && setExpanded(!expanded)}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mr-3">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{car.car_number}</h3>
                {hasDetails && (
                  expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{car.name}</p>
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
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
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
              <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('cars.numberPlate')}</p>
              <div className="flex items-center gap-2">
                <p className="text-foreground font-medium">{car.number_plate}</p>
                {car.number_plate.toLowerCase().includes('trailer') && (
                  <Truck className="h-4 w-4 text-orange-500" />
                )}
                {car.number_plate.toLowerCase().includes('miljø') && (
                  <Recycle className="h-4 w-4 text-green-600" />
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('cars.hasTrailerHitch')}</p>
              <div className="flex items-center gap-2">
                {car.has_trailer_hitch ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-foreground">{t('common.yes')}</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-muted-foreground/50" />
                    <span className="text-muted-foreground">{t('common.no')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {canViewFuelCardCode && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('cars.fuelCardCode')}</p>
              <code className="bg-muted text-foreground px-2 py-1 rounded text-xs font-mono">{car.fuel_card_code}</code>
            </div>
          )}

          {/* Expandable details section */}
          {expanded && hasDetails && (
            <div className="border-t border-border pt-3 space-y-2 animate-fade-in">
              {car.has_trailer_hitch && (car.towing_capacity_with_brakes || car.towing_capacity_without_brakes || car.total_weight) && (
                <div className="bg-blue-50 rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-medium text-blue-900">{t('cars.hasTrailerHitch')}</p>
                  {car.towing_capacity_with_brakes && (
                    <p className="text-blue-800">{t('cars.towingCapacityWithBrakes')}: {car.towing_capacity_with_brakes} kg</p>
                  )}
                  {car.towing_capacity_without_brakes && (
                    <p className="text-blue-800">{t('cars.towingCapacityWithoutBrakes')}: {car.towing_capacity_without_brakes} kg</p>
                  )}
                  {car.total_weight && (
                    <p className="text-blue-800">{t('cars.totalWeight')}: {car.total_weight} kg</p>
                  )}
                </div>
              )}
              {car.notes && car.notes.trim() !== '' && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-foreground mb-1">{t('cars.notes')}</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{car.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              {car.is_available ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">{t('common.available')}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-foreground">{t('common.unavailable')}</span>
                </>
              )}
            </div>
            {hasDetails && !expanded && (
              <button 
                onClick={() => setExpanded(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {t('common.showMore') || 'Vis detaljer'}
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileCarCard;
