import React from 'react';
import { List, CalendarRange, GanttChart } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import VacationTabs from './VacationTabs';

interface VacationHeaderProps {
  counts?: Record<string, number>;
  isServicemedarbejder: boolean;
  activeTab: string;
  onChangeTab: (value: string) => void;
  /** Kept for API compatibility; request actions now live in the workspace header. */
  onOpenRequestDialog?: () => void;
  onOpenAdminDialog?: () => void;
  /** Show the canvas "Overblik" (timeline) view; its activeTab value is 'overview'. */
  canViewOverview?: boolean;
}

/**
 * Design System 2.0 toolbar for "Ferie og fravær": status tabs (with counts)
 * on the left and an explicit Liste/Kalender view switch on the right.
 * The 'calendar' value of activeTab is unchanged so existing logic still applies.
 */
const VacationHeader: React.FC<VacationHeaderProps> = ({ counts, isServicemedarbejder, activeTab, onChangeTab, canViewOverview = false }) => {
  const { currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const { isEffectiveAdmin, isEffectiveSkadeleder, effectiveRole } = useAuth();
  const canViewCalendar = isEffectiveAdmin || isEffectiveSkadeleder || effectiveRole === 'super_admin';
  const isCalendarTab = activeTab === 'calendar';
  const isOverview = activeTab === 'overview';

  const views = [
    ...(canViewOverview ? [{ key: 'overview', label: da ? 'Overblik' : 'Overview', icon: GanttChart, active: isOverview, onClick: () => onChangeTab('overview') }] : []),
    { key: 'list', label: da ? 'Liste' : 'List', icon: List, active: !isCalendarTab && !isOverview, onClick: () => { if (isCalendarTab || isOverview) onChangeTab('all'); } },
    ...(canViewCalendar ? [{ key: 'calendar', label: da ? 'Kalender' : 'Calendar', icon: CalendarRange, active: isCalendarTab, onClick: () => onChangeTab('calendar') }] : []),
  ];

  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {isCalendarTab ? (
        <p className="text-xs text-muted-foreground">{da ? 'Kalenderoversigt over fravær i afdelingen' : 'Calendar overview of absence in the department'}</p>
      ) : (
        <VacationTabs counts={counts} isServicemedarbejder={isServicemedarbejder} activeTab={isOverview ? '' : activeTab} onChange={onChangeTab} />
      )}
      {views.length > 1 && (
        <div role="group" aria-label={da ? 'Visning' : 'View'} className="inline-flex shrink-0 self-start rounded-full border border-border/70 bg-card/80 p-1 shadow-flade sm:self-auto">
          {views.map(({ key, label, icon: Icon, active, onClick }) => (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={onClick}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors duration-140 ease-facet motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-9',
                active ? 'facet-tab-thumb font-semibold text-primary-strong' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VacationHeader;
