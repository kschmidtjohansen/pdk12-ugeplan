import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { CalendarDays, Monitor, Package, ScanLine, Shield, Smartphone, Sparkles, Sun, Users, Car, LayoutDashboard } from 'lucide-react';
import { parseWhatsNew, type WhatsNewEntry } from '@/lib/whatsNew';
import ListSkeleton from '@/components/shared/ListSkeleton';
import { useTranslation } from '@/context/TranslationContext';

const iconFor = (title: string) => {
  const s = title.toLowerCase();
  if (s.includes('3d')) return ScanLine;
  if (s.includes('vagt')) return Shield;
  if (s.includes('skærm')) return Monitor;
  if (s.includes('lager')) return Package;
  if (s.includes('min dag') || s.includes('felten') || s.includes('mobil')) return Smartphone;
  if (s.includes('fridag') || s.includes('fravær') || s.includes('ferie')) return Sun;
  if (s.includes('medarbejder')) return Users;
  if (s.includes('bil')) return Car;
  if (s.includes('dashboard')) return LayoutDashboard;
  if (s.includes('ugeplan') || s.includes('kalender')) return CalendarDays;
  return Sparkles;
};

/** Lærredets "Hvad er nyt": the newest CHANGELOG.md entries as cards. The file is loaded only when this tab opens. */
const WhatsNewList: React.FC = () => {
  const { currentLanguage } = useTranslation();
  const [entries, setEntries] = useState<WhatsNewEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    import('../../../CHANGELOG.md?raw')
      .then((m) => { if (alive) setEntries(parseWhatsNew(m.default, 30)); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  if (failed) return <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Could not load the news.' : 'Nyhederne kunne ikke hentes.'}</p>;
  if (!entries) return <ListSkeleton variant="card" rowCount={3} />;

  return (
    <ol className="flex max-w-3xl flex-col gap-3">
      {entries.map((e, i) => {
        const Icon = iconFor(e.title);
        return (
          <li key={`${e.date}-${i}`} className="facet-card grid overflow-hidden sm:grid-cols-[8.5rem_minmax(0,1fr)]">
            <div aria-hidden className="facet-news-art hidden items-center justify-center sm:flex">
              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-card text-primary-strong shadow-flydende">
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <div className="flex flex-col gap-1 px-5 py-4">
              <time dateTime={e.date} className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {format(parseISO(e.date), e.date.startsWith(String(new Date().getFullYear())) ? 'd. MMMM' : 'd. MMMM yyyy', { locale: currentLanguage === 'en' ? undefined : daLocale })}
              </time>
              <h2 className="font-display text-lg font-bold leading-tight tracking-tight text-foreground">{e.title}</h2>
              {e.summary && <p className="line-clamp-2 text-sm text-muted-foreground">{e.summary}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default WhatsNewList;
