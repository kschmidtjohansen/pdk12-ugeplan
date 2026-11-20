import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { ClipboardList, FileClock, Users, TriangleAlert, ArrowUpRight } from 'lucide-react';
import type { OperationFilter, WeekSummary } from '@/utils/plannerOperations';

interface Props {
  summary: WeekSummary;
  active?: OperationFilter;
  onSelect: (filter: OperationFilter) => void;
  loading?: boolean;
  error?: boolean;
  attention?: boolean;
  week: number;
  navigation?: React.ReactNode;
}

/** Read-only indicators: selecting one navigates/filters; it never mutates data. */
export default function WeekOperationsStrip({ summary, active = 'all', onSelect, loading, error, attention, week, navigation }: Props) {
  const { t } = useTranslation();
  const indicators = [
    { key: 'all' as const, icon: ClipboardList, count: summary.total },
    { key: 'drafts' as const, icon: FileClock, count: summary.drafts },
    { key: 'unassigned' as const, icon: Users, count: summary.unassigned },
    { key: 'conflicts' as const, icon: TriangleAlert, count: summary.conflicts },
  ];
  const status = <p role="status" className="text-xs text-muted-foreground">{t(error ? 'planner.operationsOverview.error' : loading ? 'common.loading' : summary.total === 0 ? 'planner.noAssignmentsWeek' : 'planner.operationsOverview.information')}</p>;
  return (
    <section aria-label={t(attention ? 'planner.operationsOverview.attention' : 'planner.operationsOverview.title')} className="facet-card space-y-4 p-4 sm:p-5">
      <header className={`flex flex-wrap justify-between gap-2 ${navigation ? 'items-center' : 'items-baseline'}`}>
        <div className="min-w-0 space-y-0.5">
          <h2 className="font-display text-base font-semibold tracking-tight">{t(attention ? 'planner.operationsOverview.attention' : 'planner.operationsOverview.title')} <span className="text-muted-foreground font-normal">· {t('planner.week')} {week}</span></h2>
          {navigation && status}
        </div>
        {navigation ?? status}
      </header>
      <div className={`grid grid-cols-2 gap-2 ${attention ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
        {indicators.filter(item => !attention || item.key !== 'all').map(({ key, icon: Icon, count }) => (
          <Button key={key} variant="ghost" disabled={loading || error}
            aria-pressed={attention ? undefined : active === key} aria-label={`${t(`planner.operationsOverview.${key}`)}: ${count}`}
            onClick={() => onSelect(key)} className={`facet-lift min-h-16 h-auto min-w-0 justify-start gap-3 whitespace-normal rounded-card border border-border/60 bg-background/60 px-3.5 py-2.5 text-left hover:bg-card ${!attention && active === key ? 'facet-nav-active border-transparent' : ''}`}>
            <Icon aria-hidden className={`h-4 w-4 shrink-0 ${key === 'conflicts' && count ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className="min-w-0 flex-1"><span className="block font-display text-2xl font-bold tabular-nums tracking-tight">{loading || error ? '—' : count}</span><span className="block text-xs font-normal break-words hyphens-auto">{t(`planner.operationsOverview.${key}`)}</span></span>
            {attention && <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0" />}
          </Button>
        ))}
      </div>
      {!attention && active !== 'all' && <Button variant="ghost" className="min-h-11 rounded-full" onClick={() => onSelect('all')}>{t('planner.operationsOverview.clearIssue')}</Button>}
    </section>
  );
}