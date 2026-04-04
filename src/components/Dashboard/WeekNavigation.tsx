
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

interface WeekNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  currentWeek: number;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({ 
  onPrevious, 
  onNext, 
  currentWeek 
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrevious}
        title={t('planner.previousWeek')}
        aria-label={t('planner.previousWeek')}
        className="h-8 w-8"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium px-2">
        {t('dashboard.week')} {currentWeek}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        title={t('planner.nextWeek')}
        aria-label={t('planner.nextWeek')}
        className="h-8 w-8"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WeekNavigation;
