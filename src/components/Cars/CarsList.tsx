
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
  
  return (
    <div className="grid gap-4">
      {/* Mobile view - card based display */}
      <div className="md:hidden grid gap-4">
        {cars.map((car) => (
          <Card key={car.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center mb-2">
                  <Car className="h-4 w-4 mr-2 text-polygon-blue" />
                  <h3 className="font-medium">{car.name}</h3>
                </div>
                {isAdmin && (
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(car)}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">{t('common.edit')}</span>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(car)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <span className="sr-only">{t('common.delete')}</span>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('cars.carNumber')}:</p>
                  <p>{car.carNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('cars.numberPlate')}:</p>
                  <p>{car.numberPlate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('cars.hasTrailerHitch')}:</p>
                  <p>{car.hasTrailerHitch ? 
                    <Check className="h-4 w-4 text-green-600" /> : 
                    <X className="h-4 w-4 text-red-600" />}
                  </p>
                </div>
                {canViewFuelCardCode && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">{t('cars.fuelCardCode')}:</p>
                    <code className="bg-gray-100 p-1 rounded">{car.fuelCardCode}</code>
                  </div>
                )}
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
                  <TableHead>{t('cars.vehicleName')}</TableHead>
                  <TableHead>{t('cars.carNumber')}</TableHead>
                  <TableHead>{t('cars.numberPlate')}</TableHead>
                  <TableHead>{t('cars.hasTrailerHitch')}</TableHead>
                  {canViewFuelCardCode && <TableHead>{t('cars.fuelCardCode')}</TableHead>}
                  {isAdmin && <TableHead className="w-[100px]">{t('common.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-2 text-polygon-blue" />
                        <span className="font-medium">{car.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{car.carNumber}</TableCell>
                    <TableCell>{car.numberPlate}</TableCell>
                    <TableCell>
                      {car.hasTrailerHitch ? 
                        <Check className="h-4 w-4 text-green-600" /> : 
                        <X className="h-4 w-4 text-red-600" />}
                    </TableCell>
                    {canViewFuelCardCode && (
                      <TableCell>
                        <code className="bg-gray-100 p-1 rounded">{car.fuelCardCode}</code>
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(car)}
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">{t('common.edit')}</span>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(car)}
                            className="h-8 w-8 p-0 text-destructive"
                          >
                            <span className="sr-only">{t('common.delete')}</span>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
