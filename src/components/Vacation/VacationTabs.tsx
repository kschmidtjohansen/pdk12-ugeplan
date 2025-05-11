
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  // For service employees, only show the "mine" tab
  if (isServicemedarbejder) {
    return (
      <TabsList className="grid grid-cols-1 w-full max-w-md">
        <TabsTrigger value="mine" onClick={() => onChange("mine")}>
          {t("vacation.tabs.mine")}
        </TabsTrigger>
      </TabsList>
    );
  }

  // For other roles, show All, Pending and Approved tabs
  return (
    <TabsList className="grid grid-cols-3 w-full max-w-md">
      <TabsTrigger value="all" onClick={() => onChange("all")}>
        {t("vacation.tabs.all")}
      </TabsTrigger>
      <TabsTrigger value="pending" onClick={() => onChange("pending")}>
        {t("vacation.tabs.pending")}
      </TabsTrigger>
      <TabsTrigger value="approved" onClick={() => onChange("approved")}>
        {t("vacation.tabs.approved")}
      </TabsTrigger>
    </TabsList>
  );
};

export default VacationTabs;
