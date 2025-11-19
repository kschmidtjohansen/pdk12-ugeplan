import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import type { Duty } from '@/types/duty';
import { isSameDay } from 'date-fns';

interface DutyCalendarProps {
  selectedDates: Date[];
  onSelectDates: (dates: Date[]) => void;
  duties: Duty[];
  month?: Date;
  onMonthChange?: (month: Date) => void;
}

export const DutyCalendar = ({
  selectedDates,
  onSelectDates,
  duties,
  month,
  onMonthChange,
}: DutyCalendarProps) => {
  const { t } = useTranslation();

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    const isAlreadySelected = selectedDates.some(d => isSameDay(d, date));
    
    if (isAlreadySelected) {
      onSelectDates(selectedDates.filter(d => !isSameDay(d, date)));
    } else {
      onSelectDates([...selectedDates, date]);
    }
  };

  const getDayModifiers = () => {
    const skadelederDates = duties
      .filter(d => d.duty_type === 'skadeleder_vagt')
      .map(d => new Date(d.duty_date));
    
    const kørevagtDates = duties
      .filter(d => d.duty_type === 'kørevagt')
      .map(d => new Date(d.duty_date));

    return {
      skadeleder: skadelederDates,
      kørevagt: kørevagtDates,
    };
  };

  return (
    <Card className="p-4">
      <div className="mb-2 text-sm text-muted-foreground">
        {t('duty.multipleSelection')}
      </div>
      <Calendar
        mode="multiple"
        selected={selectedDates}
        onSelect={(dates) => dates && onSelectDates(dates)}
        month={month}
        onMonthChange={onMonthChange}
        weekStartsOn={1}
        modifiers={getDayModifiers()}
        modifiersClassNames={{
          skadeleder: 'bg-blue-100 dark:bg-blue-900/30',
          kørevagt: 'bg-green-100 dark:bg-green-900/30',
        }}
      />
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-blue-100 dark:bg-blue-900/30" />
          <span>{t('duty.skadelederVagt')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-900/30" />
          <span>{t('duty.kørevagt')}</span>
        </div>
      </div>
    </Card>
  );
};
