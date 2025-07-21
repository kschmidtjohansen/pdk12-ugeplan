
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { CarData } from './types';
import { useTranslation } from '@/context/TranslationContext';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCar: CarData | null;
  onConfirmDelete: (forceDelete?: boolean) => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  currentCar,
  onConfirmDelete
}) => {
  const { t } = useTranslation();
  const [forceDelete, setForceDelete] = useState(false);
  
  const handleConfirm = () => {
    onConfirmDelete(forceDelete);
    setForceDelete(false); // Reset for next time
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setForceDelete(false); // Reset when closing
    }
    onOpenChange(newOpen);
  };
  
  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {currentCar && (
              <>
                {t('deleteConfirm.carWarning', { 
                  name: `${currentCar.name} (${currentCar.car_number})` 
                })}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="force-delete" 
              checked={forceDelete}
              onCheckedChange={(checked) => setForceDelete(checked === true)}
            />
            <label 
              htmlFor="force-delete" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('deleteConfirm.forceDelete')}
            </label>
          </div>
          {forceDelete && (
            <p className="text-sm text-amber-600 mt-2 ml-6">
              {t('deleteConfirm.forceDeleteWarning')}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            {t('deleteConfirm.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;
