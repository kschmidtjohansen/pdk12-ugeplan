import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';

interface WelcomeHeaderProps {
  userName?: string;
  dailyQuote: string;
}

const getGreeting = (hour: number, name: string, lang: string): string => {
  // Ranges (spec): 08–10 morgen, 10–12 formiddag, 12–16 eftermiddag, 16–24 aften.
  // 00–08 falder uden for spec → vis "Godaften" (sen nat hører til aften-tonen).
  if (lang === 'da') {
    if (hour >= 8 && hour < 10) return `Godmorgen ${name}`;
    if (hour >= 10 && hour < 12) return `God formiddag ${name}`;
    if (hour >= 12 && hour < 16) return `God eftermiddag ${name}`;
    return `Godaften ${name}`;
  }
  if (hour >= 8 && hour < 10) return `Good morning, ${name}`;
  if (hour >= 10 && hour < 12) return `Good late morning, ${name}`;
  if (hour >= 12 && hour < 16) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
};

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ userName, dailyQuote }) => {
  const { currentLanguage, t } = useTranslation();
  // Mount-only date: drives weekday, week-number, date and greeting (stable for the session).
  const mountedNow = useRef<Date>(new Date()).current;
  // Tick state: only updates HH:MM, at most once per minute.
  const [clockNow, setClockNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // Align first tick to the next full minute, then continue every 60s.
    const msToNextMinute = 60000 - (Date.now() % 60000);
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      setClockNow(new Date());
      intervalId = window.setInterval(() => setClockNow(new Date()), 60000);
    }, msToNextMinute);
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, []);

  const name = userName || t('common.user');

  const headerDate = useMemo(() => {
    const locale = currentLanguage === 'da' ? { locale: da } : undefined;
    return {
      dayName: format(mountedNow, 'EEEE', locale),
      weekNumber: getISOWeek(mountedNow),
      dateString: format(mountedNow, 'd.M.yyyy'),
    };
  }, [mountedNow, currentLanguage]);

  const greeting = useMemo(
    () => getGreeting(mountedNow.getHours(), name, currentLanguage),
    [mountedNow, name, currentLanguage]
  );

  const clockString = useMemo(() => format(clockNow, 'HH:mm'), [clockNow]);


  return (
    <div className="rounded-xl border border-border bg-card shadow-xs px-5 py-4 animate-fade-in-up">
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
