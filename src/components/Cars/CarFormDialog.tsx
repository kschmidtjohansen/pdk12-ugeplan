
import React, { useState } from 'react';
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
import { useDepartment } from '@/context/DepartmentContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CarFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCheckboxChange?: (field: string, checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  canViewFuelCardCode: boolean;
  setFormData?: React.Dispatch<React.SetStateAction<CarFormData>>;
}

const CarFormDialog: React.FC<CarFormDialogProps> = ({
  open,
  onOpenChange,
  formData,
  onInputChange,
  onCheckboxChange,
  onSubmit,
  isEditing,
  canViewFuelCardCode,
  setFormData,
}) => {
  const { t } = useTranslation();
  const { userDepartments, departments } = useDepartment();
  const scopeDepts = (userDepartments.length > 0 ? userDepartments : departments) || [];
  const deptIds = scopeDepts.map(d => d.id).sort();
  const { data: subDeptGroups = [] } = useQuery({
    queryKey: ['car-form-sub-departments', deptIds],
    enabled: open && deptIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_departments')
        .select('id, name, department_id')
        .in('department_id', deptIds)
        .order('name');
      if (error) throw new Error(error.message);
      return [...scopeDepts]
        .sort((a, b) => a.name.localeCompare(b.name, 'da', { numeric: true }))
        .map(d => ({ id: d.id, name: d.name, subs: (data || []).filter(s => s.department_id === d.id) }))
        .filter(g => g.subs.length > 0);
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit(e));
    } finally {
      setIsSubmitting(false);
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                const uppercased = { ...e, target: { ...e.target, name: 'car_number', value: e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '') } };
                onInputChange(uppercased as React.ChangeEvent<HTMLInputElement>);
              }}
              pattern="^[A-Z0-9\-]{2,10}$"
              title="2-10 tegn: kun store bogstaver, tal og bindestreg"
              maxLength={10}
              required
            />
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
                value={formData.fuel_card_code ?? ''}
                onChange={onInputChange}
              />
            </div>
          )}

          {subDeptGroups.length > 0 && (
            <div className="space-y-2">
              <Label>{t('cars.visibleInSubDepartments')}</Label>
              <div className="space-y-3 max-h-48 overflow-y-auto border rounded-md p-2">
                {subDeptGroups.map((group) => (
                  <div key={group.id} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">{group.name}</p>
                    {group.subs.map((sub) => (
                      <div key={sub.id} className="flex items-center space-x-2 pl-1">
                        <Checkbox
                          id={`sub-dept-${sub.id}`}
                          checked={(formData.sub_department_ids || []).includes(sub.id)}
                          onCheckedChange={(checked) => {
                            setFormData?.((prev) => {
                              const current = prev.sub_department_ids || [];
                              const updated = checked
                                ? [...current, sub.id]
                                : current.filter(id => id !== sub.id);
                              return { ...prev, sub_department_ids: updated };
                            });
                          }}
                        />
                        <Label htmlFor={`sub-dept-${sub.id}`} className="cursor-pointer text-sm">
                          {sub.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t('cars.subDepartmentOptionalHint')}</p>
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
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_trailer_hitch"
                checked={formData.has_trailer_hitch || false}
                onCheckedChange={(checked) => onCheckboxChange?.('has_trailer_hitch', checked as boolean)}
              />
              <Label htmlFor="has_trailer_hitch" className="cursor-pointer">{t('cars.hasTrailerHitch')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_in_planner"
                checked={formData.show_in_planner ?? true}
                onCheckedChange={(checked) => onCheckboxChange?.('show_in_planner', checked as boolean)}
              />
              <Label htmlFor="show_in_planner" className="cursor-pointer">{t('cars.showInPlanner')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_auxiliary"
                checked={formData.is_auxiliary ?? false}
                onCheckedChange={(checked) => onCheckboxChange?.('is_auxiliary', checked as boolean)}
              />
              <Label htmlFor="is_auxiliary" className="cursor-pointer">{t('cars.isAuxiliary')}</Label>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.saving') : isEditing ? t('common.save') : t('common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CarFormDialog;
