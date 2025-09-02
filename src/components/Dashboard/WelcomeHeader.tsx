
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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-8 text-white shadow-2xl animate-fade-in-up hover-lift">
      {/* Glass effect overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/5 to-transparent"></div>
      <div className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-white/8 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/8 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 rounded-3xl"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-white/25 backdrop-blur-sm border border-white/40 shadow-lg">
            <Clock className="h-8 w-8 text-white drop-shadow-sm" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-balance drop-shadow-sm">
                {t('dashboard.welcomeUser', { name: userName || t('common.user') })}
              </h1>
            </div>
            <p className="text-white/90 text-xl font-medium max-w-3xl leading-relaxed drop-shadow-sm">
              {dailyQuote}
            </p>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="text-right space-y-3">
            <div className="px-6 py-4 rounded-2xl bg-white/25 backdrop-blur-sm border border-white/40 shadow-lg hover-glow">
              <p className="text-white/90 uppercase tracking-wider font-semibold text-lg">
                {headerDate.dayName}
              </p>
              <p className="uppercase tracking-wider font-bold text-3xl text-white drop-shadow-sm">
                {t('dashboard.week')} {headerDate.weekNumber}
              </p>
              <p className="font-semibold text-lg text-white/90 mt-1">
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
