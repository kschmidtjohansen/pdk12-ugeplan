import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';

interface KanbanDayNavigationProps {
  weekDates: string[];
  visibleStartIndex: number;
  columnsToShow: number;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const KanbanDayNavigation: React.FC<KanbanDayNavigationProps> = ({
  weekDates,
  visibleStartIndex,
  columnsToShow,
  onNavigate
}) => {
  const { currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : undefined;
  
  const canGoPrev = visibleStartIndex > 0;
  const canGoNext = visibleStartIndex + columnsToShow < weekDates.length;
  
  // Get visible dates
  const visibleDates = weekDates.slice(visibleStartIndex, visibleStartIndex + columnsToShow);
  
  const formatDayShort = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, 'EEE d', { locale }).replace('.', '');
  };

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 bg-muted/50 rounded-lg mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('prev')}
        disabled={!canGoPrev}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <div className="flex items-center gap-2 text-base font-medium min-w-[200px] justify-center">
        {visibleDates.map((date, index) => (
          <React.Fragment key={date}>
            <span className="capitalize">{formatDayShort(date)}</span>
            {index < visibleDates.length - 1 && (
              <span className="text-muted-foreground">–</span>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('next')}
        disabled={!canGoNext}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      
      {/* Day dots indicator */}
      <div className="flex items-center gap-1.5 ml-4">
        {weekDates.map((_, index) => {
          const isVisible = index >= visibleStartIndex && index < visibleStartIndex + columnsToShow;
          return (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                isVisible ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          );
        })}
      </div>
    </div>
  );
};

export default KanbanDayNavigation;
