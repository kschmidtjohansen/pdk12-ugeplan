import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/context/TranslationContext';
import { useForm } from 'react-hook-form';
import { WarehouseItemFormData } from '@/types/warehouse';
import { WarehouseFormDialogProps } from './types';

const WarehouseFormDialog: React.FC<WarehouseFormDialogProps> = ({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
  loading,
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<WarehouseItemFormData>({
    defaultValues: editingItem ? {
      address: editingItem.address,
      case_number: editingItem.case_number || '',
      is_cleaned: editingItem.is_cleaned,
      quantity: editingItem.quantity,
      notes: editingItem.notes || '',
    } : {
      address: '',
      case_number: '',
      is_cleaned: false,
      quantity: 0,
      notes: '',
    }
  });

  const isCleaned = watch('is_cleaned');

  React.useEffect(() => {
    if (open) {
      if (editingItem) {
        reset({
          address: editingItem.address,
          case_number: editingItem.case_number || '',
          is_cleaned: editingItem.is_cleaned,
          quantity: editingItem.quantity,
          notes: editingItem.notes || '',
        });
      } else {
        reset({
          address: '',
          case_number: '',
          is_cleaned: false,
          quantity: 0,
          notes: '',
        });
      }
    }
  }, [open, editingItem, reset]);

  const handleFormSubmit = async (data: WarehouseItemFormData) => {
    await onSubmit(data);
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
            <Input
              id="address"
              placeholder={t('warehouse.placeholders.address')}
              {...register('address', { 
                required: t('warehouse.validation.addressRequired') 
              })}
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_cleaned"
              checked={isCleaned}
              onCheckedChange={(checked) => setValue('is_cleaned', checked as boolean)}
            />
            <Label htmlFor="is_cleaned" className="cursor-pointer">
              {t('warehouse.fields.isCleaned')}
            </Label>
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
