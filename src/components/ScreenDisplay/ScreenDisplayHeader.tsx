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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-white shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl transform -translate-x-12 translate-y-12"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/planner">
            <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('screenDisplay.title')}
            </h1>
            <p className="text-blue-100 text-lg font-medium">
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