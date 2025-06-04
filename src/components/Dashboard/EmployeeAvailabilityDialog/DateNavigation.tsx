
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays, format } from 'date-fns';
import { da } from 'date-fns/locale';

interface DateNavigationProps {
  title: string;
  currentDate: Date;
  viewedDate: string;
  setViewedDate: (date: string) => void;
  currentLanguage: string;
}

export const DateNavigation: React.FC<DateNavigationProps> = ({
  title,
  currentDate,
  viewedDate,
  setViewedDate,
  currentLanguage
}) => {
  const handlePreviousDay = () => {
    const previousDay = subDays(currentDate, 1);
    const previousDateStr = format(previousDay, 'yyyy-MM-dd');
    setViewedDate(previousDateStr);
    console.log('[DateNavigation] Previous day:', previousDateStr);
  };

  const handleNextDay = () => {
    const nextDay = addDays(currentDate, 1);
    const nextDateStr = format(nextDay, 'yyyy-MM-dd');
    setViewedDate(nextDateStr);
    console.log('[DateNavigation] Next day:', nextDateStr);
  };

  // Format date for display
  const formatDisplayDate = (date: Date) => {
    try {
      const locale = currentLanguage === 'da' ? da : undefined;
      const dateStr = format(date, 'PPP', { locale });
      if (currentLanguage === 'da') {
        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      }
      return dateStr;
    } catch (e) {
      console.error("Error formatting date:", e);
      return format(date, 'PPP');
    }
  };

  return (
    <div className="flex items-center justify-between py-[19px]">
      <Button variant="ghost" size="sm" onClick={handlePreviousDay} className="h-8 w-8 p-0">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-center">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {formatDisplayDate(currentDate)}
        </DialogDescription>
      </div>
      <Button variant="ghost" size="sm" onClick={handleNextDay} className="h-8 w-8 p-0">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
