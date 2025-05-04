
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CarFormData } from './types';
import { useTranslation } from '@/context/TranslationContext';

interface CarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CarFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  canViewFuelCardCode: boolean;
}

const CarFormDialog: React.FC<CarFormDialogProps> = ({
  open,
  onOpenChange,
  formData,
  onInputChange,
  onSubmit,
  isEditing,
  canViewFuelCardCode
}) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('cars.editVehicle') : t('cars.addNewVehicle')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('cars.updateVehicleInfo')
              : t('cars.addNewVehicleDesc')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('cars.vehicleName')}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carNumber">{t('cars.carNumber')}</Label>
            <Input
              id="carNumber"
              name="carNumber"
              value={formData.carNumber}
              onChange={onInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numberPlate">{t('cars.numberPlate')}</Label>
            <Input
              id="numberPlate"
              name="numberPlate"
              value={formData.numberPlate}
              onChange={onInputChange}
              required
            />
          </div>
          
          {canViewFuelCardCode && (
            <div className="space-y-2">
              <Label htmlFor="fuelCardCode">{t('cars.fuelCardCode')}</Label>
              <Input
                id="fuelCardCode"
                name="fuelCardCode"
                value={formData.fuelCardCode}
                onChange={onInputChange}
                required
              />
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit"
              className="bg-polygon-blue hover:bg-polygon-darkblue"
            >
              {isEditing ? t('common.save') : t('common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CarFormDialog;
