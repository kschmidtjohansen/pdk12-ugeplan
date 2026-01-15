
import React, { useState, useEffect } from 'react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import UnassignedResourcesSection from './UnassignedResourcesSection';
import { DutyWeekWidget } from './DutyWeekWidget';
import KanbanBoard from './KanbanBoard';
import AssignmentList from './AssignmentList';
import ViewToggle, { ViewMode } from './ViewToggle';
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
  onMoveAssignment?: (assignmentId: string, newDate: string) => Promise<void>;
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
  onMoveAssignment,
  selectedWeek,
  selectedYear,
  weekDates,
  handleShowOnScreen
}) => {
  const { t } = useTranslation();
  const { canEdit, canPublishTasks } = usePermissions();
  
  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('plannerViewMode');
    return (saved as ViewMode) || 'kanban';
  });
  
  useEffect(() => {
    localStorage.setItem('plannerViewMode', viewMode);
  }, [viewMode]);
  
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
      
      {/* View Toggle and Show on Screen Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        
        {canPublishTasks && (
          <Button 
            onClick={handleShowOnScreen}
            size="sm" 
            className="flex items-center gap-2 text-white shadow-lg bg-polygon-blue"
          >
            <Monitor className="h-4 w-4" />
            {t('planner.showOnScreen')}
          </Button>
        )}
      </div>

      {/* Kanban Board or List View based on viewMode */}
      {viewMode === 'kanban' ? (
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
          onMoveAssignment={onMoveAssignment}
          selectedWeek={selectedWeek}
          selectedYear={selectedYear}
        />
      ) : (
        <AssignmentList
          assignments={weekAssignments}
          operationStates={operationStates}
          onEditAssignment={onEditAssignment}
          onDeleteAssignment={onDeleteAssignment}
          onPublishAssignment={onPublishAssignment}
          onPublishDay={onPublishDay}
          onCreateAssignment={onCreateAssignment}
          onCopyAssignment={onCopyAssignment}
          selectedWeek={selectedWeek}
          selectedYear={selectedYear}
          weekDates={weekDates}
          cars={cars}
        />
      )}
    </div>
  );
};

export default PlannerContent;
