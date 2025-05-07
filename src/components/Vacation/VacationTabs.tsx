
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from '../../context/TranslationContext';

interface VacationTabsProps {
  isServicemedarbejder: boolean;
  activeTab: string;
  hideApprovedTab?: boolean;
  showApprovedOnly?: boolean;
}

const VacationTabs: React.FC<VacationTabsProps> = ({ 
  isServicemedarbejder, 
  activeTab,
  hideApprovedTab = false,
  showApprovedOnly = false
}) => {
  const { t } = useTranslation();

  // For the approved-only page
  if (showApprovedOnly) {
    return (
      <TabsList className="grid grid-cols-1 w-full max-w-md">
        <TabsTrigger value="approved">{t("vacation.tabs.approved")}</TabsTrigger>
      </TabsList>
    );
  }

  // For service employees, only show the "mine" tab
  if (isServicemedarbejder) {
    return (
      <TabsList className="grid grid-cols-1 w-full max-w-md">
        <TabsTrigger value="mine">{t("vacation.tabs.mine")}</TabsTrigger>
      </TabsList>
    );
  }

  // For other roles, show tabs based on configuration
  const tabs = [
    { value: "all", label: t("vacation.tabs.all") },
    { value: "pending", label: t("vacation.tabs.pending") }
  ];
  
  // Add the approved tab if we're not hiding it
  if (!hideApprovedTab) {
    tabs.push({ value: "approved", label: t("vacation.tabs.approved") });
  }
  
  // Always add the "mine" tab at the end
  tabs.push({ value: "mine", label: t("vacation.tabs.mine") });

  // Determine the grid columns based on the number of tabs
  const gridCols = `grid-cols-${tabs.length}`;

  return (
    <TabsList className={`grid ${gridCols} w-full max-w-md`}>
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
      ))}
    </TabsList>
  );
};

export default VacationTabs;
