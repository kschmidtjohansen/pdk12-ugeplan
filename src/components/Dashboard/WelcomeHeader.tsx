
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
    const dayName = currentLanguage === 'da' ? format(today, 'EEEE', { locale: da }) : format(today, 'EEEE');
    const weekNumber = getISOWeek(today);
    const dateString = format(today, 'd.M.yyyy');
    return { dayName, weekNumber, dateString };
  };

  const headerDate = getHeaderDateDisplay();

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground capitalize">
        {headerDate.dayName} · {t('dashboard.week')} {headerDate.weekNumber} · {headerDate.dateString}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t('dashboard.welcomeUser', { name: '' })} <span className="gradient-text">{userName || t('common.user')}</span>
      </h1>
      <p className="text-sm text-muted-foreground max-w-2xl">{dailyQuote}</p>
    </div>
  );
};

export default WelcomeHeader;
