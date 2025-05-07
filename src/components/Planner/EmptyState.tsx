
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

interface EmptyStateProps {
  onCreateNew: (date: string) => void; // Updated to match the expected signature
  canCreate: boolean;
  selectedWeek?: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateNew, canCreate, selectedWeek }) => {
  const { t } = useTranslation();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center space-y-3">
        <h3 className="text-lg font-medium">{t('planner.noAssignments')}</h3>
        <p className="text-gray-500 max-w-md">
          {t('planner.noAssignmentsDescription', { week: selectedWeek })}
        </p>
        
        {canCreate && (
          <Button 
            onClick={() => onCreateNew(today)} 
            className="mt-4 bg-polygon-blue"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('planner.createFirstAssignment')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
