
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/context/TranslationContext";
import { Car } from '@/types/car';

interface CarMarkAvailableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: Car | null;
  onConfirmKeepNote: (car: Car) => void;
  onConfirmDeleteNote: (car: Car) => void;
}

const CarMarkAvailableDialog: React.FC<CarMarkAvailableDialogProps> = ({
  open,
  onOpenChange,
  car,
  onConfirmKeepNote,
  onConfirmDeleteNote
}) => {
  const { t } = useTranslation();
  
  if (!car) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('cars.markAvailable')}</DialogTitle>
          <DialogDescription>
            {t('cars.keepNoteQuestion')}
          </DialogDescription>
        </DialogHeader>
        
        {car.notes && (
          <div className="bg-muted/50 p-3 rounded-md border text-sm">
            {car.notes}
          </div>
        )}
        
        <DialogFooter className="sm:justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={() => onConfirmKeepNote(car)}
            variant="outline"
          >
            {t('cars.keepNote')}
          </Button>
          <Button 
            onClick={() => onConfirmDeleteNote(car)}
            className="bg-polygon-purple hover:bg-polygon-darkpurple"
          >
            {t('cars.deleteNote')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CarMarkAvailableDialog;
