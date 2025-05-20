
import React from 'react';
import { format, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';

interface SeparateVacationDateFieldsProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

const SeparateVacationDateFields: React.FC<SeparateVacationDateFieldsProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}) => {
  const { t, currentLanguage } = useTranslation();
  
  // Set the locale based on the current language
  const locale = currentLanguage === 'da' ? da : undefined;
  const dateFormat = currentLanguage === 'da' ? "d. MMM yyyy" : "d MMM yyyy";

  // Format date with week number
  const formatDateWithWeek = (date: Date | undefined) => {
    if (!date) return null;
    
    const weekNumber = getISOWeek(date);
    return `${format(date, dateFormat, { locale })} (${t('common.week')} ${weekNumber})`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("vacation.startDate")}
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                formatDateWithWeek(startDate)
              ) : (
                <span>{t("vacation.selectStartDate")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar 
              mode="single" 
              selected={startDate} 
              onSelect={onStartDateChange} 
              initialFocus 
              locale={locale}
              weekStartsOn={1} // Ensure ISO week (starting on Monday)
              disabled={(date) => {
                // Disable dates before today and after end date if selected
                const isBeforeToday = date < new Date(new Date().setHours(0, 0, 0, 0));
                const isAfterEndDate = endDate ? date > endDate : false;
                return isBeforeToday || isAfterEndDate;
              }}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("vacation.endDate")}
        </label>
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
              {endDate ? (
                formatDateWithWeek(endDate)
              ) : (
                <span>{t("vacation.selectEndDate")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar 
              mode="single" 
              selected={endDate} 
              onSelect={onEndDateChange} 
              initialFocus 
              locale={locale}
              weekStartsOn={1} // Ensure ISO week (starting on Monday)
              disabled={(date) => {
                // Disable dates before today and before start date if selected
                const isBeforeToday = date < new Date(new Date().setHours(0, 0, 0, 0));
                const isBeforeStartDate = startDate ? date < startDate : false;
                return isBeforeToday || isBeforeStartDate;
              }}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default SeparateVacationDateFields;
