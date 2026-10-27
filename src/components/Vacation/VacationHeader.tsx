import React from 'react';
import { List, CalendarRange } from 'lucide-react';
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
}

/**
 * Design System 2.0 toolbar for "Ferie og fravær": status tabs (with counts)
 * on the left and an explicit Liste/Kalender view switch on the right.
 * The 'calendar' value of activeTab is unchanged so existing logic still applies.
 */
const VacationHeader: React.FC<VacationHeaderProps> = ({ counts, isServicemedarbejder, activeTab, onChangeTab }) => {
  const { currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const { isEffectiveAdmin, isEffectiveSkadeleder, effectiveRole } = useAuth();
  const canViewCalendar = isEffectiveAdmin || isEffectiveSkadeleder || effectiveRole === 'super_admin';
  const isCalendarTab = activeTab === 'calendar';

  const views = [
    { key: 'list', label: da ? 'Liste' : 'List', icon: List, active: !isCalendarTab, onClick: () => { if (isCalendarTab) onChangeTab('all'); } },
    { key: 'calendar', label: da ? 'Kalender' : 'Calendar', icon: CalendarRange, active: isCalendarTab, onClick: () => onChangeTab('calendar') },
  ];

  return (
    <div className="flex flex-col gap-2 border-b border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      {isCalendarTab ? (
        <p className="text-xs text-muted-foreground">{da ? 'Kalenderoversigt over fravær i afdelingen' : 'Calendar overview of absence in the department'}</p>
      ) : (
        <VacationTabs counts={counts} isServicemedarbejder={isServicemedarbejder} activeTab={activeTab} onChange={onChangeTab} />
      )}
      {canViewCalendar && (
        <div role="group" aria-label={da ? 'Visning' : 'View'} className="inline-flex shrink-0 self-start rounded-md border border-border p-0.5 sm:self-auto">
          {views.map(({ key, label, icon: Icon, active, onClick }) => (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={onClick}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-[5px] px-3 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
