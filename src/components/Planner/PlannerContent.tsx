
import React from 'react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import UnassignedResourcesSection from './UnassignedResourcesSection';
import { DutyWeekWidget } from './DutyWeekWidget';
import KanbanBoard from './KanbanBoard';
import { useUnifiedData } from '@/hooks/data/useUnifiedData';
import { useVacations } from '@/hooks/useVacations';
import { Monitor } from 'lucide-react';

interface PlannerContentProps {
  weekAssignments: Assignment[];
  operationStates: Record<string, 'publishing' | 'deleting' | 'updating' | null>;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment: (assignmentId: string) => void;
  onPublishDay: (date: string) => void;
  onCreateAssignment: (date: string) => void;
  onCopyAssignment: (assignment: Assignment) => void;
  selectedWeek: number;
  selectedYear: number;
  weekDates: ReturnType<typeof import('@/utils/dates').getWeekDates>;
  handleShowOnScreen: () => void;
}

const PlannerContent: React.FC<PlannerContentProps> = ({
  weekAssignments = [],
  operationStates = {},
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onPublishDay,
  onCreateAssignment,
  onCopyAssignment,
  selectedWeek,
  selectedYear,
  weekDates,
  handleShowOnScreen
}) => {
  const { t } = useTranslation();
  const { canEdit, canPublishTasks } = usePermissions();
  
  // Use streamlined unified data service
  const { employees, cars } = useUnifiedData();
  const { vacations } = useVacations();

  console.log(`[PlannerContent] Displaying ${weekAssignments.length} assignments with ${employees.length} employees and ${cars.length} cars`);

  return (
    <div className="space-y-6 pb-6">
      {/* Unassigned Resources and Duty Widget */}
      {(canEdit || canPublishTasks) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <UnassignedResourcesSection
              assignments={weekAssignments}
              employees={employees}
              cars={cars}
              vacations={vacations}
              weekDates={weekDates}
            />
          </div>
          <div>
            <DutyWeekWidget
              selectedWeek={selectedWeek}
              selectedYear={selectedYear}
            />
          </div>
        </div>
      )}
      
      {/* Show on Screen Button */}
      {canPublishTasks && (
        <div className="flex justify-center mb-4">
          <Button 
            onClick={handleShowOnScreen}
            size="sm" 
            className="flex items-center gap-2 text-white shadow-lg bg-polygon-blue"
          >
            <Monitor className="h-4 w-4" />
            {t('planner.showOnScreen')}
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      <KanbanBoard
        weekAssignments={weekAssignments}
        cars={cars}
        operationStates={operationStates}
        canEdit={canEdit}
        canPublishTasks={canPublishTasks}
        weekDates={weekDates}
        onEditAssignment={onEditAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onPublishAssignment={onPublishAssignment}
        onCopyAssignment={onCopyAssignment}
        onPublishDay={onPublishDay}
        onCreateAssignment={onCreateAssignment}
      />
    </div>
  );
};

export default PlannerContent;
