
import React from 'react';
import { addDays, format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useTranslation } from '../../context/TranslationContext';

interface VacationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: DateRange;
  setDate: (date: DateRange) => void;
  reason: string;
  setReason: (reason: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const VacationFormDialog: React.FC<VacationFormDialogProps> = ({
  open,
  onOpenChange,
  date,
  setDate,
  reason,
  setReason,
  onSubmit
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("vacation.applyForVacation")}</DialogTitle>
          <DialogDescription>
            {t("vacation.selectDatesAndReason")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("vacation.dateRange")}</Label>
            <div className="flex flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date.from && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date.from ? date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : format(date.from, "LLL dd, y") : (
                      <span>{t("vacation.selectVacationDates")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="range" 
                    selected={date} 
                    onSelect={setDate} 
                    initialFocus 
                    numberOfMonths={2} 
                    disabled={date => date < addDays(new Date(), 1)} 
                    className={cn("p-3 pointer-events-auto")} 
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">{t("vacation.reason")}</Label>
            <Textarea 
              id="reason" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder={t("vacation.reasonPlaceholder")} 
              required 
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="bg-polygon-purple hover:bg-polygon-darkpurple">
              {t("vacation.submitRequest")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VacationFormDialog;
