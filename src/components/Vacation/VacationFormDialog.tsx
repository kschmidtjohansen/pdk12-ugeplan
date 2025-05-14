
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DateRange } from 'react-day-picker';
import { useTranslation } from '../../context/TranslationContext';
import VacationDateSelector from './VacationDateSelector';
import SeparateVacationDateFields from './SeparateVacationDateFields';
import { Trash2 } from 'lucide-react';

interface VacationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: DateRange;
  setDate: (date: DateRange) => void;
  reason: string;
  setReason: (reason: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing?: boolean;
  onDelete?: () => void;
  // New props for separate date fields
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  useSeparateDateFields?: boolean;
}

const VacationFormDialog: React.FC<VacationFormDialogProps> = ({
  open,
  onOpenChange,
  date,
  setDate,
  reason,
  setReason,
  onSubmit,
  isEditing = false,
  onDelete,
  // New props for separate date fields
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  useSeparateDateFields = true
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? t("vacation.editVacationRequest") 
              : t("vacation.applyForVacation")}
          </DialogTitle>
          <DialogDescription>
            {t("vacation.selectDatesAndReason")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("vacation.dateRange")}</Label>
            
            {useSeparateDateFields ? (
              <SeparateVacationDateFields
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={onStartDateChange}
                onEndDateChange={onEndDateChange}
              />
            ) : (
              <VacationDateSelector date={date} setDate={setDate} />
            )}
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
          
          <DialogFooter className={isEditing ? "flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between" : ""}>
            {isEditing && onDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={onDelete} 
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("common.delete")}
              </Button>
            )}
            <div className={`flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2 ${isEditing ? "w-full sm:w-auto" : "w-full"}`}>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="bg-polygon-purple hover:bg-polygon-darkpurple w-full sm:w-auto">
                {isEditing 
                  ? t("common.save") 
                  : t("vacation.submitRequest")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VacationFormDialog;
