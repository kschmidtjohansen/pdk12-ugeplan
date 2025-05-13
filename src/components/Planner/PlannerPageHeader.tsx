import React from 'react';
import { format } from 'date-fns';
import PageHeader from '../Layout/PageHeader';
import PlannerHeader from './PlannerHeader';
import { useTranslation } from '@/context/TranslationContext';
import { formatWeekDateRange } from '@/utils/dates';

interface PlannerPageHeaderProps {
  selectedWeek: number;
  selectedYear: number;
  weekDates: ReturnType<typeof import('@/utils/dates').getWeekDates>;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCreateNew: (date: string) => void;
}

const PlannerPageHeader: React.FC<PlannerPageHeaderProps> = ({
  selectedWeek,
  selectedYear,
  weekDates,
  onPreviousWeek,
  onNextWeek,
  onCreateNew
}) => {
  const { t, currentLanguage } = useTranslation();
  
  // Format the date range with the proper locale
  const dateRangeText = formatWeekDateRange(weekDates, currentLanguage);
  console.log("Formatted date range:", dateRangeText);

  return (
    <>
      <PageHeader 
        title={t("navigation.planner")} 
        description={t("planner.weekDescription", { week: selectedWeek })}
      />
      
      <div className="text-sm text-muted-foreground mb-6">
        {dateRangeText}
      </div>

      <PlannerHeader 
        currentWeek={selectedWeek}
        currentYear={selectedYear}
        onPreviousWeek={onPreviousWeek}
        onNextWeek={onNextWeek}
        onCreateNew={onCreateNew}
      />
    </>
  );
};

export default PlannerPageHeader;
