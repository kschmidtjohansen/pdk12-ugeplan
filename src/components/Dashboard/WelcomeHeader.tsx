
import React from 'react';
import { Clock } from 'lucide-react';
import { format, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';

interface WelcomeHeaderProps {
  userName?: string;
  dailyQuote: string;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ userName, dailyQuote }) => {
  const { currentLanguage, t } = useTranslation();

  const getHeaderDateDisplay = () => {
    const today = new Date();
    if (currentLanguage === 'da') {
      const dayName = format(today, 'EEEE', { locale: da });
      const weekNumber = getISOWeek(today);
      const dateString = format(today, 'd.M.yyyy');
      return { dayName, weekNumber, dateString };
    } else {
      const dayName = format(today, 'EEEE');
      const weekNumber = getISOWeek(today);
      const dateString = format(today, 'd.M.yyyy');
      return { dayName, weekNumber, dateString };
    }
  };

  const headerDate = getHeaderDateDisplay();

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4 text-white animate-fade-in-up" style={{ willChange: 'transform, opacity' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent py-0"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('dashboard.welcomeUser', { name: userName || t('common.user') })}
            </h1>
            <p className="text-blue-100 text-sm font-medium max-w-2xl">
              {dailyQuote}
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="text-right space-y-2">
            <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
              <p className="text-blue-100 uppercase tracking-wider font-semibold text-base">
                {headerDate.dayName}
              </p>
              <p className="uppercase tracking-wider font-semibold text-2xl text-white">
                {t('dashboard.week')} {headerDate.weekNumber}
              </p>
              <p className="font-bold text-base text-blue-100">
                {headerDate.dateString}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
