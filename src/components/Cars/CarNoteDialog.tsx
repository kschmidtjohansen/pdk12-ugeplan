import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CarData } from './types';
import { useTranslation } from '@/context/TranslationContext';

interface CarNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: CarData | null;
  onSaved?: () => void;
}

const CarNoteDialog: React.FC<CarNoteDialogProps> = ({ open, onOpenChange, car, onSaved }) => {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setNote(car?.notes || '');
  }, [open, car]);

  const handleSave = async () => {
    if (!car) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).rpc('update_car_note', {
        _car_id: car.id,
        _note: note,
      });
      if (error) throw error;
      toast({ title: 'Note gemt', description: `Noten for ${car.car_number} er opdateret.` });
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Kunne ikke gemme noten',
        description: err?.message || 'Ukendt fejl',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Note på {car?.car_number}</DialogTitle>
          <DialogDescription>
            Tilføj eller ret en note, fx hvis der er fejl eller mangler på bilen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="car-note">{t('cars.notes')}</Label>
          <Textarea
            id="car-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder={t('cars.enterNote')}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? '…' : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CarNoteDialog;
