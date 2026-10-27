import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '../../context/TranslationContext';

interface VacationTabsProps {
  counts?: Record<string, number>;
  isServicemedarbejder: boolean;
  activeTab: string;
  onChange: (value: string) => void;
  /** Deprecated: the calendar is now a separate view switch in VacationHeader. */
  canViewCalendar?: boolean;
}

/** Status tabs for vacation requests. Each tab carries a text label + count (not colour only). */
const VacationTabs: React.FC<VacationTabsProps> = ({ counts, activeTab, onChange }) => {
  const { t, currentLanguage } = useTranslation();
  const entries = [
    { key: 'all', label: t('vacation.tabs.all') },
    { key: 'pending', label: t('vacation.tabs.pending') },
    { key: 'approved', label: t('vacation.tabs.approved') },
    { key: 'rejected', label: currentLanguage === 'da' ? 'Afviste' : 'Rejected' },
  ];
  return (
    <Tabs value={activeTab} onValueChange={onChange} className="min-w-0">
      <TabsList
        aria-label={currentLanguage === 'da' ? 'Anmodningernes status' : 'Request status'}
        className="grid h-auto w-full grid-cols-2 gap-1 bg-transparent p-0 sm:inline-flex sm:w-auto"
      >
        {entries.map((entry) => (
          <TabsTrigger
            key={entry.key}
            value={entry.key}
            aria-controls={`vacation-panel-${entry.key}`}
            className="min-h-11 min-w-0 justify-between gap-2 px-3 text-xs sm:justify-center"
          >
            <span className="truncate">{entry.label}</span>
            {counts?.[entry.key] !== undefined && (
              <span className="rounded bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-foreground" data-testid={`vacation-count-${entry.key}`}>
                {counts[entry.key]}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default VacationTabs;
