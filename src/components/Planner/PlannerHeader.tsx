
import React from 'react';
import PageHeader from '../Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

interface PlannerHeaderProps {
  currentWeek: number;
  canCreate: boolean;
  onCreateNew: () => void;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({ 
  currentWeek, 
  canCreate, 
  onCreateNew 
}) => {
  const { t } = useTranslation();

  return (
    <PageHeader 
      title={t("navigation.planner")}
      description={t("planner.weekDescription", { week: currentWeek })}
    >
      {canCreate && (
        <Button 
          onClick={onCreateNew}
          className="bg-polygon-purple hover:bg-polygon-darkpurple"
        >
          <Plus className="mr-2 h-4 w-4" /> {t("planner.newAssignment")}
        </Button>
      )}
    </PageHeader>
  );
};

export default PlannerHeader;
