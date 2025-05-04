
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
} from "@/components/ui/alert-dialog";
import { CarData } from './types';
import { useTranslation } from '@/context/TranslationContext';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCar: CarData | null;
  onConfirmDelete: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  currentCar,
  onConfirmDelete
}) => {
  const { t } = useTranslation();
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {currentCar && (
              <>
                {t('deleteConfirm.carWarning', { name: <strong>{currentCar.name}</strong> })}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirmDelete}
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
