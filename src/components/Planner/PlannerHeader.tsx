
import React from 'react';
import PageHeader from '../Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

interface PlannerHeaderProps {
  currentWeek: number;
  canCreate: boolean;
  onCreateNew: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  currentWeek,
  canCreate,
  onCreateNew,
  onPreviousWeek,
  onNextWeek
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <PageHeader title={t("navigation.planner")} description={t("planner.weekDescription", {
        week: currentWeek
      })}>
        {canCreate && <Button onClick={onCreateNew} className="bg-polygon-blue">
          <Plus className="mr-2 h-4 w-4" /> {t("planner.newAssignment")}
        </Button>}
      </PageHeader>
      
      <div className="flex justify-center space-x-4 w-full">
        <Button onClick={onPreviousWeek} variant="outline" className="flex items-center">
          <ChevronLeft className="mr-2 h-4 w-4" /> {t("planner.previousWeek")}
        </Button>
        <Button onClick={onNextWeek} variant="outline" className="flex items-center">
          {t("planner.nextWeek")} <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PlannerHeader;
