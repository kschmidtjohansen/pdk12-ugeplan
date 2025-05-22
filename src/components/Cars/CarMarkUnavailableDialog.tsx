
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/context/TranslationContext";
import { Car } from '@/types/car';

interface CarMarkUnavailableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: Car | null;
  onConfirm: (car: Car, note: string) => void;
}

const CarMarkUnavailableDialog: React.FC<CarMarkUnavailableDialogProps> = ({
  open,
  onOpenChange,
  car,
  onConfirm
}) => {
  const { t } = useTranslation();
  const [note, setNote] = useState<string>("");
  
  const handleConfirm = () => {
    if (car) {
      onConfirm(car, note);
      setNote("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('cars.markUnavailable')}</DialogTitle>
          <DialogDescription>
            {t('cars.unavailabilityReason')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder={t('cars.enterNote')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <DialogFooter className="sm:justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setNote("");
              onOpenChange(false);
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-polygon-purple hover:bg-polygon-darkpurple"
            disabled={!note}
          >
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CarMarkUnavailableDialog;
