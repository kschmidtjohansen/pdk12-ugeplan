
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
    <div className="bg-card rounded-xl border border-border/40 shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              {t('dashboard.welcomeUser', { name: userName || t('common.user') })}
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {dailyQuote}
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="bg-muted/50 rounded-lg border border-border/40 p-3 text-right space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {headerDate.dayName}
            </p>
            <p className="text-lg font-semibold text-foreground">
              {t('dashboard.week')} {headerDate.weekNumber}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {headerDate.dateString}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
