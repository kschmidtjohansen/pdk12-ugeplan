
import React from 'react';
import PageHeader from '../Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { format } from 'date-fns';

interface PlannerHeaderProps {
  currentWeek: number;
  weekDateRange: string;
  canCreate: boolean;
  onCreateNew: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onPublishTodayTasks?: () => void;
  hasTasksToPublishToday?: boolean;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  currentWeek,
  weekDateRange,
  canCreate,
  onCreateNew,
  onPreviousWeek,
  onNextWeek,
  onPublishTodayTasks,
  hasTasksToPublishToday = false
}) => {
  const { t } = useTranslation();
  const { canPublishTasks } = usePermissions();
  
  // Check if today is within the current week
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-4">
      <PageHeader title={t("navigation.planner")} description={t("planner.weekDescription", {
        week: currentWeek
      })}>
        <div className="flex gap-2">
          {canCreate && <Button onClick={onCreateNew} className="bg-polygon-blue">
            <Plus className="mr-2 h-4 w-4" /> {t("planner.newAssignment")}
          </Button>}
          
          {canPublishTasks && hasTasksToPublishToday && onPublishTodayTasks && (
            <Button 
              onClick={onPublishTodayTasks} 
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="mr-2 h-4 w-4" /> {t("planner.publishTodayTasks")}
            </Button>
          )}
        </div>
      </PageHeader>
      
      <div className="flex flex-col md:flex-row justify-between items-center w-full">
        <p className="text-sm font-medium mb-2 md:mb-0">{weekDateRange}</p>
        <div className="flex justify-center space-x-4">
          <Button onClick={onPreviousWeek} variant="outline" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" /> {t("planner.previousWeek")}
          </Button>
          <Button onClick={onNextWeek} variant="outline" className="flex items-center">
            {t("planner.nextWeek")} <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlannerHeader;
