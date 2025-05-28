
import React from 'react';
import PageHeader from '../Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Monitor } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { format } from 'date-fns';
import { getWeekDates } from '@/utils/dates';
import { da } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface PlannerHeaderProps {
  currentWeek: number;
  currentYear: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCreateNew: (date: string) => void;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  currentWeek,
  currentYear,
  onPreviousWeek,
  onNextWeek,
  onCreateNew
}) => {
  const { t, currentLanguage } = useTranslation();
  const { canCreate } = usePermissions();
  const navigate = useNavigate();
  
  // Get the first day of the current week
  const { start } = getWeekDates(currentWeek, currentYear);
  
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

  // Navigate to screen display page
  const handleShowOnScreen = () => {
    navigate('/screen-display');
  };
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-center w-full mb-6">
      <div className="flex gap-2 mb-2 md:mb-0">
        {canCreate && 
          <Button onClick={handleCreateNew} className="bg-polygon-blue">
            <Plus className="mr-2 h-4 w-4" /> {t("planner.newAssignment")}
          </Button>
        }
        <Button onClick={handleShowOnScreen} variant="outline">
          <Monitor className="mr-2 h-4 w-4" /> {t("planner.showOnScreen")}
        </Button>
      </div>
      
      <div className="flex space-x-4">
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
