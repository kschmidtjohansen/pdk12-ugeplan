
import React from 'react';
import { format, getISOWeek, isSameWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useTranslation } from '@/context/TranslationContext';
import { formatDateRangeWithWeeks } from '@/utils/dateUtils';

interface VacationDateSelectorProps {
  date: DateRange | undefined;
  setDate: (date: DateRange) => void;
}

const VacationDateSelector: React.FC<VacationDateSelectorProps> = ({
  date,
  setDate
}) => {
  const { t, currentLanguage } = useTranslation();
  
  // Set the locale based on the current language
  const locale = currentLanguage === 'da' ? da : undefined;

  // Initialize with an empty date range if date is undefined
  const safeDate: DateRange = date || { from: undefined, to: undefined };

  return (
    <div className="flex flex-col">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !safeDate.from && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {safeDate.from ? (
              safeDate.to ? (
                // Both start and end date are selected
                formatDateRangeWithWeeks(
                  safeDate.from,
                  safeDate.to,
                  currentLanguage,
                  t('common.week')
                )
              ) : (
                // Only start date is selected
                `${format(safeDate.from, currentLanguage === 'da' ? "d. MMM yyyy" : "d MMM yyyy", { locale })} (${t('common.week')} ${getISOWeek(safeDate.from)})`
              )
            ) : (
              <span>{t("vacation.selectVacationDates")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar 
            mode="range" 
            selected={safeDate} 
            onSelect={setDate} 
            initialFocus 
            numberOfMonths={2}
            locale={locale}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VacationDateSelector;
