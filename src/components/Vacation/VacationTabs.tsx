
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from '../../context/TranslationContext';

interface VacationTabsProps {
  isServicemedarbejder: boolean;
  activeTab: string;
}

const VacationTabs: React.FC<VacationTabsProps> = ({ 
  isServicemedarbejder, 
  activeTab 
}) => {
  const { t } = useTranslation();

  // For service employees, only show the "mine" tab
  if (isServicemedarbejder) {
    return (
      <TabsList className="grid grid-cols-1 w-full max-w-md">
        <TabsTrigger value="mine">{t("vacation.tabs.mine")}</TabsTrigger>
      </TabsList>
    );
  }

  // For other roles, show all tabs
  return (
    <TabsList className="grid grid-cols-4 w-full max-w-md">
      <TabsTrigger value="all">{t("vacation.tabs.all")}</TabsTrigger>
      <TabsTrigger value="pending">{t("vacation.tabs.pending")}</TabsTrigger>
      <TabsTrigger value="approved">{t("vacation.tabs.approved")}</TabsTrigger>
      <TabsTrigger value="mine">{t("vacation.tabs.mine")}</TabsTrigger>
    </TabsList>
  );
};

export default VacationTabs;
