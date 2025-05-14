
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from '../../context/TranslationContext';

interface VacationTabsProps {
  isServicemedarbejder: boolean;
  activeTab: string;
  onChange: (value: string) => void;
}

const VacationTabs: React.FC<VacationTabsProps> = ({ 
  isServicemedarbejder, 
  activeTab,
  onChange
}) => {
  const { t } = useTranslation();

  // Show all tabs regardless of role, but servicemedarbejder will have different functionality
  return (
    <Tabs value={activeTab} onValueChange={onChange} className="w-full">
      <TabsList className="grid grid-cols-3 w-full max-w-md">
        <TabsTrigger value="all">
          {t("vacation.tabs.all")}
        </TabsTrigger>
        <TabsTrigger value="pending">
          {t("vacation.tabs.pending")}
        </TabsTrigger>
        <TabsTrigger value="approved">
          {t("vacation.tabs.approved")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default VacationTabs;
