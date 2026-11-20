import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import { Quote } from 'lucide-react';

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


  const hour = mountedNow.getHours();
  const tid = hour < 10 ? 'morgen' : hour < 17 ? 'dag' : 'aften';

  return (
    <div data-tid={tid} className="facet-dagslys facet-glow rounded-panel border border-border/50 px-4 py-4 shadow-flade sm:px-6 sm:py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground md:hidden">
            {headerDate.dayName} · {t('dashboard.week')} {headerDate.weekNumber} · <span className="tabular-nums">{clockString}</span>
          </p>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground break-words md:text-3xl">
            {greeting}
          </h1>
          <figure className="flex items-start gap-2 text-sm text-muted-foreground">
            <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <blockquote className="italic"><span className="sr-only">{t('ui.dailyQuote')}: </span>{dailyQuote}</blockquote>
          </figure>
        </div>
        <div className="hidden min-w-[140px] flex-col items-end text-right md:flex">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {headerDate.dayName}
          </span>
          <span className="font-display text-base font-semibold text-primary-strong">
            {t('dashboard.week')} {headerDate.weekNumber}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {headerDate.dateString}
          </span>
          <span className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
            {clockString}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
