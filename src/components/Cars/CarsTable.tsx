
import React from 'react';
import { Car, Edit, Trash2, Check, X, ToggleLeft, ToggleRight, Info, Truck, Recycle } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { CarData } from './types';
import { useTranslation } from '@/context/TranslationContext';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface CarsTableProps {
  cars: CarData[];
  canViewFuelCardCode: boolean;
  isAdmin: boolean;
  onEdit: (car: CarData) => void;
  onDelete: (car: CarData) => void;
  onToggleAvailability: (car: CarData) => void;
}

const CarsTable: React.FC<CarsTableProps> = ({
  cars,
  canViewFuelCardCode,
  isAdmin,
  onEdit,
  onDelete,
  onToggleAvailability
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead className="text-muted-foreground font-medium">{t('cars.carNumber')}</TableHead>
            <TableHead className="text-muted-foreground font-medium">{t('cars.vehicleName')}</TableHead>
            <TableHead className="text-muted-foreground font-medium">{t('cars.numberPlate')}</TableHead>
            {canViewFuelCardCode && <TableHead className="text-muted-foreground font-medium">{t('cars.fuelCardCode')}</TableHead>}
            <TableHead className="text-muted-foreground font-medium">{t('cars.hasTrailerHitch')}</TableHead>
            <TableHead className="text-muted-foreground font-medium">{t('cars.isAvailable')}</TableHead>
            {isAdmin && <TableHead className="w-[150px] text-muted-foreground font-medium">{t('common.actions')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => (
            <TableRow key={car.id} className="border-border hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mr-3">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{car.car_number}</span>
                </div>
              </TableCell>
              <TableCell className="text-foreground">{car.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{car.number_plate}</span>
                  {car.number_plate.toLowerCase().includes('trailer') && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Truck className="h-4 w-4 text-orange-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Trailer</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {car.number_plate.toLowerCase().includes('miljø') && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Recycle className="h-4 w-4 text-green-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Miljøvogn</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              {canViewFuelCardCode && (
                <TableCell>
                  <code className="bg-muted text-foreground px-2 py-1 rounded text-xs font-mono">{car.fuel_card_code}</code>
                </TableCell>
              )}
              <TableCell>
                {car.has_trailer_hitch ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-foreground">{t('common.yes')}</span>
                    {(car.towing_capacity_with_brakes || car.towing_capacity_without_brakes || car.total_weight) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-blue-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            {car.towing_capacity_with_brakes && (
                              <p>Med bremser: {car.towing_capacity_with_brakes} kg</p>
                            )}
                            {car.towing_capacity_without_brakes && (
                              <p>Uden bremser: {car.towing_capacity_without_brakes} kg</p>
                            )}
                            {car.total_weight && (
                              <p>Totalvægt: {car.total_weight} kg</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <X className="h-4 w-4 mr-2 text-muted-foreground/50" />
                    <span className="text-muted-foreground">{t('common.no')}</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {car.is_available ? (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-foreground">{t('common.available')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-foreground">{t('common.unavailable')}</span>
                    </div>
                  )}
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
              </TableCell>
              {isAdmin && (
                <TableCell>
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
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CarsTable;
