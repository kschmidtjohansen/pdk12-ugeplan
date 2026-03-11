import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddressAutocomplete from '@/components/Planner/AddressAutocomplete';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { useForm } from 'react-hook-form';
import { WarehouseItemFormData } from '@/types/warehouse';
import { WarehouseFormDialogProps } from './types';
import { useDepartment } from '@/context/DepartmentContext';
import { useLocations } from '@/hooks/warehouse/useLocations';

const WarehouseFormDialog: React.FC<WarehouseFormDialogProps> = ({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
  loading,
}) => {
  const { t } = useTranslation();
  const { selectedDepartmentId } = useDepartment();
  const { locations } = useLocations(selectedDepartmentId);
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<WarehouseItemFormData>({
    defaultValues: editingItem ? {
      address: editingItem.address,
      case_number: editingItem.case_number || '',
      is_cleaned: editingItem.is_cleaned,
      quantity: editingItem.quantity,
      hall: editingItem.hall || undefined,
      notes: editingItem.notes || '',
    } : {
      address: '',
      case_number: '',
      is_cleaned: 'nej',
      quantity: 0,
      hall: undefined,
      notes: '',
    }
  });

  const isCleaned = watch('is_cleaned');
  const hall = watch('hall');

  React.useEffect(() => {
    if (open) {
      if (editingItem) {
        reset({
          address: editingItem.address,
          case_number: editingItem.case_number || '',
          is_cleaned: editingItem.is_cleaned,
          quantity: editingItem.quantity,
          hall: editingItem.hall || undefined,
          notes: editingItem.notes || '',
        });
      } else {
        reset({
          address: '',
          case_number: '',
          is_cleaned: 'nej',
          quantity: 0,
          hall: undefined,
          notes: '',
        });
      }
    }
  }, [open, editingItem, reset]);

  const handleFormSubmit = async (data: WarehouseItemFormData) => {
    if (!watch('address')?.trim()) return;
    await onSubmit({ ...data, address: watch('address') });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? t('warehouse.editItem') : t('warehouse.addNew')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">{t('warehouse.fields.address')} *</Label>
            <AddressAutocomplete
              value={watch('address')}
              onChange={(val) => setValue('address', val, { shouldValidate: true })}
              onAddressSelect={(data) => setValue('address', data.address, { shouldValidate: true })}
              placeholder={t('warehouse.placeholders.address')}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_number">{t('warehouse.fields.caseNumber')}</Label>
            <Input
              id="case_number"
              placeholder={t('warehouse.placeholders.caseNumber')}
              {...register('case_number')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_cleaned">{t('warehouse.fields.isCleaned')}</Label>
            <Select value={isCleaned} onValueChange={(value) => setValue('is_cleaned', value as 'ja' | 'nej' | 'ikke_noedvendigt')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">{t('warehouse.cleanedStatus.ja')}</SelectItem>
                <SelectItem value="nej">{t('warehouse.cleanedStatus.nej')}</SelectItem>
                <SelectItem value="ikke_noedvendigt">{t('warehouse.cleanedStatus.ikkeNoedvendigt')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('warehouse.fields.hall')}</Label>
            {locations.length > 0 ? (
              <Select value={hall || '__none__'} onValueChange={(value) => setValue('hall', value === '__none__' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('warehouse.fields.hall')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">-</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.key} value={loc.key}>{loc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('warehouse.noLocations', { fallback: 'Ingen lokationer oprettet for denne afdeling' })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">{t('warehouse.fields.quantity')} *</Label>
            <Input
              id="quantity"
              type="number"
              placeholder={t('warehouse.placeholders.quantity')}
              {...register('quantity', { 
                required: t('warehouse.validation.quantityRequired'),
                min: { value: 0, message: t('warehouse.validation.quantityMin') },
                valueAsNumber: true
              })}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('warehouse.fields.notes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('warehouse.placeholders.notes')}
              rows={3}
              {...register('notes')}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('warehouse.actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : t('warehouse.actions.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WarehouseFormDialog;
