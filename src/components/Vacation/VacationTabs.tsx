
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from '../../context/TranslationContext';

interface VacationTabsProps {
  isServicemedarbejder: boolean;
  activeTab: string;
  onChange: (value: string) => void;
  canViewCalendar?: boolean;
}

const VacationTabs: React.FC<VacationTabsProps> = ({ 
  isServicemedarbejder, 
  activeTab,
  onChange,
  canViewCalendar = false,
}) => {
  const { t } = useTranslation();

  const cols = canViewCalendar ? 'grid-cols-4' : 'grid-cols-3';
  const maxW = canViewCalendar ? 'max-w-xl' : 'max-w-md';

  return (
    <Tabs value={activeTab} onValueChange={onChange} className="w-full">
      <TabsList className={`grid ${cols} w-full ${maxW}`}>
        <TabsTrigger value="all">
          {t("vacation.tabs.all")}
        </TabsTrigger>
        <TabsTrigger value="pending">
          {t("vacation.tabs.pending")}
        </TabsTrigger>
        <TabsTrigger value="approved">
          {t("vacation.tabs.approved")}
        </TabsTrigger>
        {canViewCalendar && (
          <TabsTrigger value="calendar">
            {t("vacation.tabs.calendar")}
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
};

export default VacationTabs;
