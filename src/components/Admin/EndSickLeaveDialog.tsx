import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EndSickLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sickLeave: { employee_name: string; start_date: string } | null;
  onConfirm: (endDate: Date) => Promise<void>;
}

export const EndSickLeaveDialog: React.FC<EndSickLeaveDialogProps> = ({
  open,
  onOpenChange,
  sickLeave,
  onConfirm
}) => {
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(endDate);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raskmeldt medarbejder</DialogTitle>
          <DialogDescription>
            Markér {sickLeave?.employee_name} som raskmeldt og angiv sidste sygedag
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Sidste sygedag</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP', { locale: da }) : "Vælg dato"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                  locale={da}
                  disabled={(date) => 
                    date < new Date(sickLeave?.start_date || new Date()) ||
                    date > new Date()
                  }
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Medarbejderen er tilbage på arbejde dagen efter denne dato
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuller
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Gemmer...' : 'Bekræft raskmelding'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
