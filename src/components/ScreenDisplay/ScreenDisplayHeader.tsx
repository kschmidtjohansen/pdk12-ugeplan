import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface ScreenDisplayHeaderProps {
  selectedDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

export const ScreenDisplayHeader: React.FC<ScreenDisplayHeaderProps> = ({
  selectedDate,
  onPreviousDay,
  onNextDay,
  onToday
}) => {
  const { t, currentLanguage } = useTranslation();

  const formatDate = (date: Date) => {
    const locale = currentLanguage === 'da' ? da : undefined;
    return format(date, 'EEEE, d. MMMM yyyy', { locale });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/planner">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('screenDisplay.title')}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {formatDate(selectedDate)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={onPreviousDay} 
            variant="outline" 
            size="sm" 
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            onClick={onToday} 
            variant="outline" 
            size="sm" 
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 px-4"
          >
            {t('planner.today')}
          </Button>
          <Button 
            onClick={onNextDay} 
            variant="outline" 
            size="sm" 
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};