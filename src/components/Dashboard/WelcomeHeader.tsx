import React, { useEffect, useState } from 'react';
import { format, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';

interface WelcomeHeaderProps {
  userName?: string;
  dailyQuote: string;
}

const getGreeting = (hour: number, name: string, lang: string): string => {
  if (lang === 'da') {
    if (hour >= 8 && hour < 10) return `Godmorgen ${name}`;
    if (hour >= 10 && hour < 12) return `God formiddag ${name}`;
    if (hour >= 12 && hour < 16) return `God eftermiddag ${name}`;
    if (hour >= 16 || hour < 5) return `Godaften ${name}`;
    return `Hej ${name}`;
  }
  if (hour >= 8 && hour < 10) return `Good morning, ${name}`;
  if (hour >= 10 && hour < 12) return `Good late morning, ${name}`;
  if (hour >= 12 && hour < 16) return `Good afternoon, ${name}`;
  if (hour >= 16 || hour < 5) return `Good evening, ${name}`;
  return `Hello, ${name}`;
};

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ userName, dailyQuote }) => {
  const { currentLanguage, t } = useTranslation();
  const [now, setNow] = useState<Date>(() => new Date());

  // Update every 30s — enough to keep HH:MM, week and date live without churn
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const getHeaderDateDisplay = () => {
    if (currentLanguage === 'da') {
      const dayName = format(now, 'EEEE', { locale: da });
      const weekNumber = getISOWeek(now);
      const dateString = format(now, 'd.M.yyyy');
      return { dayName, weekNumber, dateString };
    }
    const dayName = format(now, 'EEEE');
    const weekNumber = getISOWeek(now);
    const dateString = format(now, 'd.M.yyyy');
    return { dayName, weekNumber, dateString };
  };

  const headerDate = getHeaderDateDisplay();
  const clockString = format(now, 'HH:mm');
  const name = userName || t('common.user');
  const greeting = getGreeting(now.getHours(), name, currentLanguage);

  return (
    <div className="relative rounded-xl border border-border bg-card shadow-xs px-5 py-4 animate-fade-in-up overflow-hidden">
      <div aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground truncate">
            {greeting} <span aria-hidden>👋</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {dailyQuote}
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-right border-l border-border pl-4 min-w-[140px]">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {headerDate.dayName}
          </span>
          <span className="text-base font-semibold text-primary">
            {t('dashboard.week')} {headerDate.weekNumber}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {headerDate.dateString}
          </span>
          <span className="text-xs font-semibold text-foreground tabular-nums mt-0.5">
            {clockString}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
