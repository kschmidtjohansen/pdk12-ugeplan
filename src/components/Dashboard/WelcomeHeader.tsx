import React from 'react';
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
    <div className="rounded-xl border border-border bg-card shadow-xs px-5 py-4 animate-fade-in-up">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground truncate">
            {t('dashboard.welcomeUser', { name: userName || t('common.user') })}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {dailyQuote}
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-right border-l border-border pl-4 min-w-[140px]">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {headerDate.dayName}
          </span>
          <span className="text-base font-semibold text-foreground">
            {t('dashboard.week')} {headerDate.weekNumber}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {headerDate.dateString}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
