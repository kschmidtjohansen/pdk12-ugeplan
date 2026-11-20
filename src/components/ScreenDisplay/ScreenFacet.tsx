import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { Car, CalendarX2, ChevronLeft, ChevronRight, Home, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import {
  SIGNAGE_PAGE_SECONDS, buildCrews, buildSignagePages, chunk, missingTeam, sortByTime, type Crew, type SignagePage,
} from './screenModel';

/* ---------- shared pieces ---------- */

const useNow = (everyMs: number) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return now;
};

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

const Person: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
  <span className={cn('inline-flex min-w-0 items-center gap-[0.5em] font-semibold', className)}>
    <span aria-hidden className="facet-screen-avatar">{initials(name)}</span>
    <span className="truncate">{name}</span>
  </span>
);

const CarChip: React.FC<{ car: string | null; className?: string }> = ({ car, className }) => {
  const { t } = useTranslation();
  return (
    <span className={cn('facet-screen-car', !car && 'is-none', className)}>
      <Car className="h-[1em] w-[1em] shrink-0" aria-hidden />
      <span className="truncate">{car ?? t('screenDisplay.noCar')}</span>
    </span>
  );
};

const time = (t?: string) => t?.slice(0, 5) ?? '';

export interface ScreenNav {
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

/** Logo, title, subtitle, an operator nav that stays quiet, and the big clock. */
const ScreenFrame: React.FC<{
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  nav: ScreenNav;
  below?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, right, nav, below, children }) => {
  const { t } = useTranslation();
  const now = useNow(15_000);
  return (
    <div className="facet-screen facet-glow flex min-h-dvh w-full flex-col">
      <header className="flex items-center gap-[1.2em] px-[2.4em] pb-[0.9em] pt-[1.3em]">
        <img src="/favicon.svg" alt="PolyPlan" className="h-[2.6em] w-[2.6em] shrink-0 rounded-[0.6em]" />
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate font-display text-[1.9em] font-bold leading-[1.1] tracking-tight text-foreground">{title}</h1>
          <p className="truncate text-[1.05em] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-[1.2em]">
          {right}
          <nav aria-label="Dato" className="flex items-center gap-1 opacity-35 transition-opacity duration-200 hover:opacity-100 focus-within:opacity-100">
            <Link to="/planner" aria-label={t('navigation.planner')} className="facet-screen-navbtn"><Home className="h-4 w-4" aria-hidden /></Link>
            <button type="button" onClick={nav.onPreviousDay} aria-label={t('common.previous')} className="facet-screen-navbtn"><ChevronLeft className="h-4 w-4" aria-hidden /></button>
            <button type="button" onClick={nav.onToday} className="facet-screen-navbtn px-3 text-xs font-semibold">{t('planner.today')}</button>
            <button type="button" onClick={nav.onNextDay} aria-label={t('common.next')} className="facet-screen-navbtn"><ChevronRight className="h-4 w-4" aria-hidden /></button>
          </nav>
          <time dateTime={format(now, 'HH:mm')} className="font-display text-[3.6em] font-bold leading-none tracking-tight text-primary-foreground tabular-nums dark:text-foreground">
            {format(now, 'HH:mm')}
          </time>
        </div>
      </header>
      {below}
      <main className="flex min-h-0 flex-1 flex-col px-[2.4em] pb-[2em] pt-[1em]">{children}</main>
    </div>
  );
};

const EmptyDay: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="facet-card m-auto flex max-w-[34em] flex-col items-center gap-[0.6em] px-[2em] py-[2.4em] text-center">
      <CalendarX2 className="h-[2.4em] w-[2.4em] text-muted-foreground" aria-hidden />
      <h2 className="font-display text-[1.5em] font-bold">{t('screenDisplay.noTasksPlanned')}</h2>
      <p className="text-muted-foreground">{t('screenDisplay.noTasksDescription')}</p>
    </div>
  );
};

const subtitleFor = (date: Date, count: number, isDa: boolean, t: (k: string, p?: Record<string, unknown>) => string) => {
  const d = format(date, 'EEEE d. MMMM', { locale: isDa ? daLocale : undefined });
  const n = count === 1 ? t('screenDisplay.taskCountOne') : t('screenDisplay.tasksCount', { count });
  return `${d.charAt(0).toUpperCase()}${d.slice(1)} · ${n}`;
};

/** Cycles through `parts` every `seconds`; returns the current index. */
const usePager = (parts: number, seconds: number) => {
  const [i, setI] = useState(0);
  useEffect(() => { setI(0); }, [parts]);
  useEffect(() => {
    if (parts <= 1) return;
    const id = window.setInterval(() => setI(x => (x + 1) % parts), seconds * 1000);
    return () => window.clearInterval(id);
  }, [parts, seconds]);
  return parts <= 1 ? 0 : i % parts;
};

/* ---------- 07:00–09:00: the whole day ---------- */

const OverviewCard: React.FC<{ a: Assignment }> = ({ a }) => {
  const { t } = useTranslation();
  const people = (a.assignedEmployees ?? []).map(e => e.name).filter(Boolean);
  return (
    <article className={cn('facet-screen-card flex flex-col gap-[0.6em] px-[1.1em] py-[1em]', missingTeam(a) && 'is-warn')}>
      <div className="flex items-center gap-[0.6em]">
        <span className="font-mono text-[1.5em] font-medium text-primary-foreground dark:text-foreground">{time(a.fromTime)}</span>
        <span className="text-muted-foreground">– {time(a.toTime)}</span>
        {missingTeam(a) && <span className="facet-screen-warn ml-auto">{t('screenDisplay.missingTeam')}</span>}
      </div>
      <div className="min-w-0">
        <p className="text-[1.3em] font-bold leading-tight">{a.title}</p>
        <p className="truncate text-muted-foreground">{a.location}</p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-[1em] gap-y-[0.4em] border-t border-border/60 pt-[0.6em]">
        {people.map(n => <Person key={n} name={n} />)}
        <CarChip car={a.cars?.[0] ?? null} className="ml-auto" />
      </div>
    </article>
  );
};

const OverviewRow: React.FC<{ a: Assignment }> = ({ a }) => {
  const { t } = useTranslation();
  const people = (a.assignedEmployees ?? []).map(e => e.name.split(' ')[0]).filter(Boolean).join(', ');
  return (
    <li className={cn('facet-screen-card grid grid-cols-[3.6em_minmax(0,1fr)] items-center gap-x-[0.8em] px-[0.9em] py-[0.55em]', missingTeam(a) && 'is-warn')}>
      <span className="row-span-2 font-mono text-[1.2em] font-medium text-primary-foreground dark:text-foreground">{time(a.fromTime)}</span>
      <span className="flex min-w-0 items-center gap-[0.5em]">
        <span className="truncate font-bold">{a.title}</span>
        {a.cars?.[0] && <CarChip car={a.cars[0]} className="ml-auto shrink-0 text-[0.8em]" />}
      </span>
      <span className="flex min-w-0 items-center gap-[0.6em] text-[0.85em] text-muted-foreground">
        <span className="min-w-0 truncate">{a.location}</span>
        <span className="ml-auto max-w-[55%] shrink-0 truncate font-semibold text-foreground">{people || <span className="facet-screen-warn">{t('screenDisplay.missingTeam')}</span>}</span>
      </span>
    </li>
  );
};

const CrewItem: React.FC<{ crew: Crew; compact?: boolean }> = ({ crew, compact }) => compact ? (
  <li className="grid grid-cols-[6.2em_minmax(0,1fr)] items-start gap-[0.7em] border-b border-border/60 py-[0.5em] last:border-0">
    <CarChip car={crew.car} className="text-[0.85em]" />
    <span className="font-semibold leading-snug">{crew.people.join(', ')}</span>
  </li>
) : (
  <li className="flex flex-col gap-[0.4em] border-b border-border/60 py-[0.65em] last:border-0">
    <CarChip car={crew.car} className="self-start" />
    <span className="flex flex-wrap gap-x-[0.9em] gap-y-[0.3em]">{crew.people.map(n => <Person key={n} name={n} />)}</span>
  </li>
);

export const ScreenOverview: React.FC<{
  assignments: Assignment[];
  absentNames: string[];
  selectedDate: Date;
  showMorningBadge: boolean;
  nav: ScreenNav;
}> = ({ assignments, absentNames, selectedDate, showMorningBadge, nav }) => {
  const { t, currentLanguage } = useTranslation();
  const isDa = currentLanguage === 'da';
  const tasks = useMemo(() => sortByTime(assignments), [assignments]);
  const crews = useMemo(() => buildCrews(assignments), [assignments]);
  const big = tasks.length <= 9;
  const taskParts = useMemo(() => (big ? [tasks] : chunk(tasks, 27)), [tasks, big]);
  const compactCrews = crews.length > 6;
  const crewParts = useMemo(() => chunk(crews, compactCrews ? 10 : 6), [crews, compactCrews]);
  const ti = usePager(taskParts.length, 20);
  const ci = usePager(crewParts.length, 20);
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const right = showMorningBadge
    ? <span className="facet-screen-pill">{t('screenDisplay.morningBadge')}</span>
    : !isToday
      ? <span className="facet-screen-pill">{t('screenDisplay.showingDate', { date: format(selectedDate, 'd. MMMM', { locale: isDa ? daLocale : undefined }) })}</span>
      : null;

  return (
    <ScreenFrame title={t('screenDisplay.overviewTitle')} subtitle={subtitleFor(selectedDate, tasks.length, isDa, t)} right={right} nav={nav}>
      {tasks.length === 0 ? <EmptyDay /> : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(18em,24em)] gap-[1.4em]">
          <section aria-label={t('screenDisplay.overviewTitle')} className="flex min-h-0 flex-col gap-[0.6em]">
            {big ? (
              <div className="grid grid-cols-3 content-start gap-[0.9em]">{tasks.map(a => <OverviewCard key={a.id} a={a} />)}</div>
            ) : (
              <ol className="grid grid-flow-col grid-cols-3 grid-rows-[repeat(9,minmax(0,auto))] content-start gap-[0.5em]">
                {taskParts[ti]?.map(a => <OverviewRow key={a.id} a={a} />)}
              </ol>
            )}
            {taskParts.length > 1 && (
              <p className="mt-auto text-[0.9em] font-semibold text-primary-strong">{t('screenDisplay.page', { n: ti + 1, m: taskParts.length })}</p>
            )}
          </section>
          <aside aria-labelledby="screen-crews" className="facet-screen-card flex min-h-0 flex-col overflow-hidden px-[1.3em] py-[1.1em]">
            <h2 id="screen-crews" className="font-display text-[1.5em] font-bold tracking-tight">{t('screenDisplay.crewsTitle')}</h2>
            <p className="text-muted-foreground">{t('screenDisplay.crewsSub')}{crewParts.length > 1 && ` · ${t('screenDisplay.part', { n: ci + 1, m: crewParts.length })}`}</p>
            <ul className="mt-[0.3em] min-h-0 overflow-hidden">{crewParts[ci]?.map(c => <CrewItem key={c.car ?? 'none'} crew={c} compact={compactCrews} />)}</ul>
            {absentNames.length > 0 && (
              <div className="mt-auto flex items-start gap-[0.5em] rounded-[0.9em] bg-warning-soft px-[0.9em] py-[0.7em] text-warning-soft-foreground" role="status">
                <UserX className="mt-[0.15em] h-[1.1em] w-[1.1em] shrink-0" aria-hidden />
                <span><span className="font-bold">{t('screenDisplay.absentTitle')}:</span> {absentNames.join(', ')}</span>
              </div>
            )}
          </aside>
        </div>
      )}
    </ScreenFrame>
  );
};

/* ---------- after 09:00: the signage loop ---------- */

const pageTitle = (p: SignagePage, t: (k: string, v?: Record<string, unknown>) => string) => {
  const base = p.kind === 'crews' ? t('screenDisplay.crewsTitle') : p.kind === 'tasks' ? t('screenDisplay.overviewTitle') : t('screenDisplay.absentTitle');
  return 'parts' in p && p.parts > 1 ? `${base} (${t('screenDisplay.part', { n: p.part, m: p.parts })})` : base;
};

const CrewCard: React.FC<{ crew: Crew }> = ({ crew }) => {
  const { t } = useTranslation();
  return (
    <article className="facet-screen-card flex flex-col gap-[0.8em] px-[1.3em] py-[1.2em]">
      <CarChip car={crew.car} className="self-start text-[1.35em]" />
      <div className="flex flex-col gap-[0.5em] text-[1.35em]">{crew.people.map(n => <Person key={n} name={n} />)}</div>
      {crew.first && (
        <div className="mt-auto border-t border-border/60 pt-[0.6em]">
          <p className="text-muted-foreground">{t('screenDisplay.firstTask')} · <span className="font-mono">{time(crew.first.fromTime)}</span></p>
          <p className="truncate text-[1.15em] font-bold">{crew.first.title}</p>
          <p className="truncate text-muted-foreground">{crew.first.location}</p>
        </div>
      )}
    </article>
  );
};

const TaskRow: React.FC<{ a: Assignment }> = ({ a }) => {
  const { t } = useTranslation();
  const people = (a.assignedEmployees ?? []).map(e => e.name).filter(Boolean).join(', ');
  return (
    <li className={cn('facet-screen-card grid grid-cols-[5.2em_minmax(0,1.5fr)_minmax(0,1fr)_auto] items-center gap-[1em] px-[1.1em] py-[0.75em]', missingTeam(a) && 'is-warn')}>
      <span className="font-mono text-[1.5em] font-medium text-primary-foreground dark:text-foreground">{time(a.fromTime)}</span>
      <span className="min-w-0">
        <span className="block truncate text-[1.3em] font-bold leading-tight">{a.title}</span>
        <span className="block truncate text-muted-foreground">{a.location}</span>
      </span>
      <span className="truncate text-[1.1em] font-semibold">{people || <span className="facet-screen-warn">{t('screenDisplay.missingTeam')}</span>}</span>
      <CarChip car={a.cars?.[0] ?? null} className="justify-self-end" />
    </li>
  );
};

export const ScreenSignage: React.FC<{
  assignments: Assignment[];
  absentNames: string[];
  selectedDate: Date;
  nav: ScreenNav;
  pageSeconds?: number;
}> = ({ assignments, absentNames, selectedDate, nav, pageSeconds = SIGNAGE_PAGE_SECONDS }) => {
  const { t, currentLanguage } = useTranslation();
  const isDa = currentLanguage === 'da';
  const now = useNow(1000);
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
  // Recompute the pages at most once a minute so finished tasks drop out during the day.
  const minuteKey = Math.floor(now.getTime() / 60_000);
  const pages = useMemo(
    () => buildSignagePages(assignments, absentNames, 6, 8, isToday ? new Date(minuteKey * 60_000).getHours() * 60 + new Date(minuteKey * 60_000).getMinutes() : undefined),
    [assignments, absentNames, isToday, minuteKey],
  );
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => { setIndex(i => (pages.length ? i % pages.length : 0)); }, [pages.length]);
  useEffect(() => {
    if (pages.length <= 1) return;
    if (now.getTime() - startedAt >= pageSeconds * 1000) {
      setIndex(i => (i + 1) % pages.length);
      setStartedAt(now.getTime());
    }
  }, [now, startedAt, pageSeconds, pages.length]);

  const go = (i: number) => { setIndex(i); setStartedAt(Date.now()); };
  const page = pages[index];
  const left = Math.max(0, pageSeconds - Math.floor((now.getTime() - startedAt) / 1000));
  const subtitle = subtitleFor(selectedDate, assignments.length, isDa, t);

  const right = pages.length > 1 ? (
    <nav aria-label={t('screenDisplay.pages')} className="facet-screen-pill flex items-center gap-[0.5em]">
      {pages.map((p, i) => (
        <button
          key={i}
          type="button"
          onClick={() => go(i)}
          aria-label={pageTitle(p, t)}
          aria-current={i === index ? 'true' : undefined}
          className={cn('h-[0.6em] rounded-full transition-all duration-200 ease-facet', i === index ? 'w-[2em] bg-primary' : 'w-[0.6em] bg-primary-strong/30')}
        />
      ))}
      <span className="ml-[0.3em]">
        {t('screenDisplay.page', { n: index + 1, m: pages.length })} · {t('screenDisplay.nextIn', { time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` })}
      </span>
    </nav>
  ) : null;

  const progress = pages.length > 1 ? (
    <div aria-hidden className="mx-[2.4em] h-[0.3em] overflow-hidden rounded-full bg-primary/15">
      <div key={`${index}-${startedAt}`} className="facet-screen-progress h-full rounded-full bg-primary" style={{ animationDuration: `${pageSeconds}s` }} />
    </div>
  ) : null;

  return (
    <ScreenFrame title={page ? pageTitle(page, t) : t('screenDisplay.overviewTitle')} subtitle={subtitle} right={right} nav={nav} below={progress}>
      {!page ? <EmptyDay /> : (
        <div key={index} className="facet-screen-page flex min-h-0 flex-1 flex-col">
          {page.kind === 'crews' && (
            <div className="grid flex-1 grid-cols-3 content-start gap-[1.1em]">{page.crews.map(c => <CrewCard key={c.car ?? 'none'} crew={c} />)}</div>
          )}
          {page.kind === 'tasks' && (
            <ol className="flex flex-col gap-[0.6em]">{page.tasks.map(a => <TaskRow key={a.id} a={a} />)}</ol>
          )}
          {page.kind === 'absent' && (
            <ul className="grid grid-cols-3 content-start gap-[1em] text-[1.4em]">
              {page.names.map(n => <li key={n} className="facet-screen-card px-[0.9em] py-[0.7em]"><Person name={n} /></li>)}
            </ul>
          )}
        </div>
      )}
    </ScreenFrame>
  );
};
