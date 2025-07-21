
import React, { useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { VacationRequestType } from '@/types/vacation';
import { DateRange } from 'react-day-picker';

interface EnhancedVacationFormProps {
  onSubmit: (data: {
    dateRange: DateRange;
    requestType: VacationRequestType;
    startTime?: string;
    endTime?: string;
    reason: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EnhancedVacationForm: React.FC<EnhancedVacationFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { t, currentLanguage } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [requestType, setRequestType] = useState<VacationRequestType>('full_day');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dateRange?.from || !dateRange?.to) {
      return;
    }

    if (requestType === 'partial_day' && (!startTime || !endTime)) {
      return;
    }

    if (requestType === 'partial_day' && startTime >= endTime) {
      return;
    }

    onSubmit({
      dateRange,
      requestType,
      startTime: requestType === 'partial_day' ? startTime : undefined,
      endTime: requestType === 'partial_day' ? endTime : undefined,
      reason
    });
  };

  const formatDateDisplay = (date: Date) => {
    try {
      const locale = currentLanguage === 'da' ? da : undefined;
      return format(date, "PPP", { locale });
    } catch (e) {
      return format(date, "PPP");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Date Selection */}
      <div className="space-y-2">
        <Label>{t('vacation.dateRange')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {formatDateDisplay(dateRange.from)} - {formatDateDisplay(dateRange.to)}
                  </>
                ) : (
                  formatDateDisplay(dateRange.from)
                )
              ) : (
                t('common.selectDate')
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={currentLanguage === 'da' ? da : undefined}
            />
          </PopoverContent>
        </Popover>
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

      {/* Reason Field */}
      <div className="space-y-2">
        <Label htmlFor="reason">{t('vacation.reason')}</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('vacation.reasonPlaceholder')}
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          {t('common.cancel')}
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !dateRange?.from || !dateRange?.to || (requestType === 'partial_day' && (!startTime || !endTime || startTime >= endTime))}
          className="flex-1"
        >
          {isLoading ? t('common.loading') : t('vacation.submitRequest')}
        </Button>
      </div>
    </form>
  );
};
