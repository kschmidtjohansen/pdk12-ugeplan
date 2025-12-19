
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CarFormData } from './types';
import { useTranslation } from '@/context/TranslationContext';

interface CarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CarFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCheckboxChange?: (field: string, checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  canViewFuelCardCode: boolean;
}

const CarFormDialog: React.FC<CarFormDialogProps> = ({
  open,
  onOpenChange,
  formData,
  onInputChange,
  onCheckboxChange,
  onSubmit,
  isEditing,
  canViewFuelCardCode
}) => {
  const { t } = useTranslation();
  
  // Handle checkbox change if no specific handler is provided
  const handleCheckboxChange = (field: string, checked: boolean) => {
    if (onCheckboxChange) {
      onCheckboxChange(field, checked);
    }
  };
  
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
            <Label htmlFor="car_number">{t('cars.carNumber')}</Label>
            <Input
              id="car_number"
              name="car_number"
              value={formData.car_number}
              onChange={(e) => {
                // Auto-uppercase and filter invalid characters
                const sanitized = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                onInputChange({
                  ...e,
                  target: { ...e.target, name: 'car_number', value: sanitized }
                } as React.ChangeEvent<HTMLInputElement>);
              }}
              maxLength={10}
              placeholder={t('cars.carNumberHelper')}
              required
            />
            <p className="text-xs text-muted-foreground">{t('cars.carNumberHelper')}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="number_plate">{t('cars.numberPlate')}</Label>
            <Input
              id="number_plate"
              name="number_plate"
              value={formData.number_plate}
              onChange={onInputChange}
              required
            />
          </div>
          
          {canViewFuelCardCode && (
            <div className="space-y-2">
              <Label htmlFor="fuel_card_code">{t('cars.fuelCardCode')}</Label>
              <Input
                id="fuel_card_code"
                name="fuel_card_code"
                value={formData.fuel_card_code}
                onChange={onInputChange}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t('cars.notes')}</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={onInputChange}
              placeholder={t('cars.enterNote')}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_trailer_hitch"
                checked={formData.has_trailer_hitch || false}
                onCheckedChange={(checked) => onCheckboxChange?.('has_trailer_hitch', checked as boolean)}
              />
              <Label htmlFor="has_trailer_hitch">{t('cars.hasTrailerHitch')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(checked) => onCheckboxChange?.('is_available', checked as boolean)}
              />
              <Label htmlFor="is_available">{t('cars.isAvailable')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_in_planner"
                checked={formData.show_in_planner ?? true}
                onCheckedChange={(checked) => onCheckboxChange?.('show_in_planner', checked as boolean)}
              />
              <Label htmlFor="show_in_planner">{t('cars.showInPlanner')}</Label>
            </div>
          </div>

          {formData.has_trailer_hitch && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="towing_capacity_with_brakes">{t('cars.towingCapacityWithBrakes')}</Label>
                <Input
                  id="towing_capacity_with_brakes"
                  name="towing_capacity_with_brakes"
                  type="number"
                  value={formData.towing_capacity_with_brakes || ''}
                  onChange={onInputChange}
                  placeholder="kg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="towing_capacity_without_brakes">{t('cars.towingCapacityWithoutBrakes')}</Label>
                <Input
                  id="towing_capacity_without_brakes"
                  name="towing_capacity_without_brakes"
                  type="number"
                  value={formData.towing_capacity_without_brakes || ''}
                  onChange={onInputChange}
                  placeholder="kg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_weight">{t('cars.totalWeight')}</Label>
                <Input
                  id="total_weight"
                  name="total_weight"
                  type="number"
                  value={formData.total_weight || ''}
                  onChange={onInputChange}
                  placeholder="kg"
                />
              </div>
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
