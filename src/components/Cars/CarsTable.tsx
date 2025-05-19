
import React from 'react';
import { Car, Edit, Trash2, Check, X } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface CarsTableProps {
  cars: CarData[];
  canViewFuelCardCode: boolean;
  isAdmin: boolean;
  onEdit: (car: CarData) => void;
  onDelete: (car: CarData) => void;
}

const CarsTable: React.FC<CarsTableProps> = ({
  cars,
  canViewFuelCardCode,
  isAdmin,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('cars.carNumber')}</TableHead>
              <TableHead>{t('cars.vehicleName')}</TableHead>
              <TableHead>{t('cars.numberPlate')}</TableHead>
              {canViewFuelCardCode && <TableHead>{t('cars.fuelCardCode')}</TableHead>}
              <TableHead>{t('cars.hasTrailerHitch')}</TableHead>
              <TableHead>{t('cars.isAvailable')}</TableHead>
              {isAdmin && <TableHead className="w-[100px]">{t('common.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cars.map((car) => (
              <TableRow key={car.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-2 text-polygon-blue" />
                    <span className="font-medium">{car.car_number}</span>
                  </div>
                </TableCell>
                <TableCell>{car.name}</TableCell>
                <TableCell>{car.number_plate}</TableCell>
                {canViewFuelCardCode && (
                  <TableCell>
                    <code className="bg-gray-100 p-1 rounded">{car.fuel_card_code}</code>
                  </TableCell>
                )}
                <TableCell>
                  {car.has_trailer_hitch ? (
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                      <span>{t('common.yes')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <X className="h-4 w-4 mr-1 text-red-500" />
                      <span>{t('common.no')}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {car.is_available ? (
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                      <span>{t('common.available')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <X className="h-4 w-4 mr-1 text-red-500" />
                      <span>{t('common.unavailable')}</span>
                    </div>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell>
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
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CarsTable;
