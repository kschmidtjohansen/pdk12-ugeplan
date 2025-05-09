
import React from 'react';
import PageHeader from '../Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { format } from 'date-fns';
import { getWeekDates } from '@/utils/weekDates';
import { da } from 'date-fns/locale';

interface PlannerHeaderProps {
  currentWeek: number;
  setCurrentWeek: (week: number) => void;
  onCreateNew: (date: string) => void;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  currentWeek,
  setCurrentWeek,
  onCreateNew
}) => {
  const { t, currentLanguage } = useTranslation();
  const { canCreate } = usePermissions();
  
  // Get the first day of the current week
  const { start } = getWeekDates(currentWeek);
  
  // Format date to get a readable string for button tooltip
  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d. MMMM', {
      locale: currentLanguage === 'da' ? da : undefined
    });
  };
  
  // Create new task defaults to the first day of the week
  const handleCreateNew = () => {
    const dateString = format(start, 'yyyy-MM-dd');
    onCreateNew(dateString);
  };
  
  const handlePreviousWeek = () => {
    setCurrentWeek(currentWeek - 1);
  };
  
  const handleNextWeek = () => {
    setCurrentWeek(currentWeek + 1);
  };
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-center w-full mb-6">
      <div className="flex gap-2 mb-2 md:mb-0">
        {canCreate && 
          <Button onClick={handleCreateNew} className="bg-polygon-blue">
            <Plus className="mr-2 h-4 w-4" /> {t("planner.newAssignment")}
          </Button>
        }
      </div>
      
      <div className="flex space-x-4">
        <Button onClick={handlePreviousWeek} variant="outline" className="flex items-center">
          <ChevronLeft className="mr-2 h-4 w-4" /> {t("planner.previousWeek")}
        </Button>
        <Button onClick={handleNextWeek} variant="outline" className="flex items-center">
          {t("planner.nextWeek")} <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PlannerHeader;
