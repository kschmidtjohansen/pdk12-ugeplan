
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
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DateRange } from 'react-day-picker';
import { useTranslation } from '../../context/TranslationContext';
import { VacationRequestType } from '@/types/vacation';
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
  // Props for separate date fields
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  useSeparateDateFields?: boolean;
  // New props for request type and times
  requestType: VacationRequestType;
  setRequestType: (type: VacationRequestType) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
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
  // Props for separate date fields
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  useSeparateDateFields = true,
  // New props for request type and times
  requestType,
  setRequestType,
  startTime,
  setStartTime,
  endTime,
  setEndTime
}) => {
  const { t } = useTranslation();

  // Log props when dialog is opened to debug
  React.useEffect(() => {
    if (open) {
      console.log("VacationFormDialog opened with props:", {
        isEditing,
        date,
        startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
        endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
        reason,
        requestType,
        startTime,
        endTime
      });
    }
  }, [open, isEditing, date, startDate, endDate, reason, requestType, startTime, endTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate partial day times
    if (requestType === 'partial_day' && (!startTime || !endTime)) {
      return;
    }
    
    if (requestType === 'partial_day' && startTime >= endTime) {
      return;
    }
    
    // Make sure that both start and end dates have the time set to 12:00 to avoid timezone issues
    if (useSeparateDateFields && startDate && endDate) {
      // Clone the dates to avoid modifying the originals
      const normalizedStartDate = new Date(startDate.getTime());
      normalizedStartDate.setHours(12, 0, 0, 0);
      
      const normalizedEndDate = new Date(endDate.getTime());
      normalizedEndDate.setHours(12, 0, 0, 0);
      
      // Update the start and end dates
      onStartDateChange(normalizedStartDate);
      onEndDateChange(normalizedEndDate);
      
      console.log("Normalized dates for submission:", {
        normalizedStartDate: normalizedStartDate.toISOString(),
        normalizedEndDate: normalizedEndDate.toISOString()
      });
    }
    
    console.log("Form submitted with data:", {
      isEditing,
      startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
      reason,
      requestType,
      startTime,
      endTime
    });
    
    onSubmit(e);
  };

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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('vacation.requestType')}</Label>
            <RadioGroup 
              value={requestType} 
              onValueChange={(value) => setRequestType(value as VacationRequestType)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full_day" id="full_day" />
                <Label htmlFor="full_day" className="cursor-pointer">
                  {t('vacation.fullDay')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial_day" id="partial_day" />
                <Label htmlFor="partial_day" className="cursor-pointer">
                  {t('vacation.partialDay')}
                </Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              {requestType === 'full_day' ? t('vacation.fullDayDescription') : t('vacation.partialDayDescription')}
            </p>
          </div>

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

          {/* Time Selection for Partial Days */}
          {requestType === 'partial_day' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">{t('vacation.workingHours')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">{t('vacation.startTime')}</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">{t('vacation.endTime')}</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              {startTime && endTime && startTime >= endTime && (
                <p className="text-sm text-destructive">{t('vacation.invalidTimeRange')}</p>
              )}
            </div>
          )}
          
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
              <Button 
                type="submit" 
                className="bg-polygon-purple hover:bg-polygon-darkpurple w-full sm:w-auto"
                disabled={requestType === 'partial_day' && (!startTime || !endTime || startTime >= endTime)}
              >
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
