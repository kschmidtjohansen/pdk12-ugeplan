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
}

/** Read-only indicators: selecting one navigates/filters; it never mutates data. */
export default function WeekOperationsStrip({ summary, active = 'all', onSelect, loading, error, attention, week }: Props) {
  const { t } = useTranslation();
  const indicators = [
    { key: 'all' as const, icon: ClipboardList, count: summary.total },
    { key: 'drafts' as const, icon: FileClock, count: summary.drafts },
    { key: 'unassigned' as const, icon: Users, count: summary.unassigned },
    { key: 'conflicts' as const, icon: TriangleAlert, count: summary.conflicts },
  ];
  return (
    <section aria-label={t(attention ? 'planner.operationsOverview.attention' : 'planner.operationsOverview.title')} className="border-y border-border py-3 space-y-3">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{t(attention ? 'planner.operationsOverview.attention' : 'planner.operationsOverview.title')} <span className="text-muted-foreground font-normal">· {t('planner.week')} {week}</span></h2>
        <p role="status" className="text-xs text-muted-foreground">{t(error ? 'planner.operationsOverview.error' : loading ? 'common.loading' : summary.total === 0 ? 'planner.noAssignmentsWeek' : 'planner.operationsOverview.information')}</p>
      </header>
      <div className={`grid grid-cols-2 gap-2 ${attention ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
        {indicators.filter(item => !attention || item.key !== 'all').map(({ key, icon: Icon, count }) => (
          <Button key={key} variant={!attention && active === key ? 'secondary' : 'ghost'} disabled={loading || error}
            aria-pressed={attention ? undefined : active === key} aria-label={`${t(`planner.operationsOverview.${key}`)}: ${count}`}
            onClick={() => onSelect(key)} className="min-h-16 h-auto min-w-0 justify-start gap-3 whitespace-normal border border-border px-3 py-2 text-left">
            <Icon aria-hidden className={`h-4 w-4 shrink-0 ${key === 'conflicts' && count ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className="min-w-0 flex-1"><span className="block text-xl font-semibold tabular-nums">{loading || error ? '—' : count}</span><span className="block text-xs font-normal break-words">{t(`planner.operationsOverview.${key}`)}</span></span>
            {attention && <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0" />}
          </Button>
        ))}
      </div>
      {!attention && active !== 'all' && <Button variant="ghost" className="min-h-11" onClick={() => onSelect('all')}>{t('planner.operationsOverview.clearIssue')}</Button>}
    </section>
  );
}