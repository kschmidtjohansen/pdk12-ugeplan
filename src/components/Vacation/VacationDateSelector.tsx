
import React from 'react';
import { addDays, format } from 'date-fns';
import { da } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useTranslation } from '@/context/TranslationContext';

interface VacationDateSelectorProps {
  date: DateRange;
  setDate: (date: DateRange) => void;
}

const VacationDateSelector: React.FC<VacationDateSelectorProps> = ({
  date,
  setDate
}) => {
  const { t, currentLanguage } = useTranslation();
  
  // Set the locale based on the current language
  const locale = currentLanguage === 'da' ? da : undefined;

  return (
    <div className="flex flex-col">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date.from && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? date.to ? (
              <>
                {format(date.from, "d. MMM yyyy", { locale })} -{" "}
                {format(date.to, "d. MMM yyyy", { locale })}
              </>
            ) : format(date.from, "d. MMM yyyy", { locale }) : (
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
            locale={locale}
            disabled={date => date < addDays(new Date(), 1)} 
            className={cn("p-3 pointer-events-auto")} 
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VacationDateSelector;
