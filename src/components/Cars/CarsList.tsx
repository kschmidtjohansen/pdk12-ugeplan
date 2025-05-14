
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

interface CarsListProps {
  cars: CarData[];
  canEdit: boolean;
  canViewFuelCardCode: boolean;
  isAdmin: boolean;
  onEdit: (car: CarData) => void;
  onDelete: (car: CarData) => void;
}

const CarsList: React.FC<CarsListProps> = ({
  cars,
  canEdit,
  canViewFuelCardCode,
  isAdmin,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();
  
  // Sort cars by car_number
  const sortedCars = [...cars].sort((a, b) => a.car_number.localeCompare(b.car_number));
  
  return (
    <div className="grid gap-4">
      {/* Mobile view - card based display */}
      <div className="md:hidden grid gap-4">
        {sortedCars.map((car) => (
          <Card key={car.id} className="overflow-hidden">
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
                <div className="col-span-2">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop view - table based display */}
      <div className="hidden md:block">
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
                  {isAdmin && <TableHead className="w-[100px]">{t('common.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCars.map((car) => (
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
      </div>
    </div>
  );
};

export default CarsList;
