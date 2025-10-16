import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/context/TranslationContext';
import { WarehouseDeleteDialogProps } from './types';

const WarehouseDeleteDialog: React.FC<WarehouseDeleteDialogProps> = ({
  open,
  onOpenChange,
  item,
  onConfirm,
  loading,
}) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('warehouse.deleteConfirm.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('warehouse.deleteConfirm.message')}
            {item && (
              <div className="mt-2 font-medium">
                {item.address}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {t('warehouse.deleteConfirm.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? t('common.loading') : t('warehouse.deleteConfirm.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WarehouseDeleteDialog;
