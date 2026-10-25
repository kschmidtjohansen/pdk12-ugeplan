
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from '../../context/TranslationContext';

interface VacationTabsProps {
  counts?: Record<string, number>;
  isServicemedarbejder: boolean;
  activeTab: string;
  onChange: (value: string) => void;
  canViewCalendar?: boolean;
}

const VacationTabs: React.FC<VacationTabsProps> = ({ 
  counts, 
  activeTab,
  onChange,
  canViewCalendar = false,
}) => {
  const { t } = useTranslation();

  const { currentLanguage } = useTranslation();
  const entries = [
    { key: 'all', label: t('vacation.tabs.all') },
    { key: 'pending', label: t('vacation.tabs.pending') },
    { key: 'approved', label: t('vacation.tabs.approved') },
    { key: 'rejected', label: currentLanguage === 'da' ? 'Afviste' : 'Rejected' },
    ...(canViewCalendar ? [{ key: 'calendar', label: t('vacation.tabs.calendar') }] : []),
  ];
  return <Tabs value={activeTab} onValueChange={onChange} className="min-w-0 w-full">
    <TabsList aria-label={currentLanguage === 'da' ? 'Anmodningernes status' : 'Request status'} className="grid h-auto w-full grid-cols-2 gap-1 bg-transparent p-0 sm:flex sm:flex-wrap">
      {entries.map(entry => <TabsTrigger key={entry.key} value={entry.key} aria-controls={`vacation-panel-${entry.key}`} className="min-h-14 min-w-0 flex-1 justify-between gap-2 whitespace-normal px-3 text-xs">
        <span>{entry.label}</span>{counts?.[entry.key] !== undefined && <span className="font-semibold tabular-nums">{counts[entry.key]}</span>}
      </TabsTrigger>)}
    </TabsList>
  </Tabs>;
};

export default VacationTabs;
