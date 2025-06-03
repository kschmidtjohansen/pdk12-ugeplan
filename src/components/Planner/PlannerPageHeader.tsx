import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { formatDateRangeWithWeeks } from '@/utils/dateUtils';

interface PlannerPageHeaderProps {
  selectedWeek: number;
  selectedYear: number;
  weekDates: { start: Date; end: Date; weekNumber: number; year: number } | null;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCreateNew: (date: string) => void;
  onPublishAllUnpublished?: () => void;
}

const PlannerPageHeader: React.FC<PlannerPageHeaderProps> = ({
  selectedWeek,
  selectedYear,
  weekDates,
  onPreviousWeek,
  onNextWeek,
  onCreateNew,
  onPublishAllUnpublished
}) => {
  const { t } = useTranslation();
  const { canCreate, canPublishTasks } = usePermissions();

  const handleCreateNew = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    onCreateNew(today);
  };

  const weekRangeText = weekDates ? formatDateRangeWithWeeks(
    weekDates.start, 
    weekDates.end, 
    'en', 
    t('planner.week')
  ) : '';

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">
          {t('navigation.planner')}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousWeek}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium min-w-[200px] text-center">
              {t('planner.week')} {selectedWeek}, {selectedYear}
              {weekRangeText && (
                <span className="block text-xs text-gray-500 mt-1">
                  {weekRangeText}
                </span>
              )}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onNextWeek}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        {canPublishTasks && onPublishAllUnpublished && (
          <Button
            onClick={onPublishAllUnpublished}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {t('planner.publishAllUnpublished')}
          </Button>
        )}
        
        {canCreate && (
          <Button
            onClick={handleCreateNew}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('planner.createNew')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlannerPageHeader;
