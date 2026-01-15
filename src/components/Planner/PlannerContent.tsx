
import React, { useState, useEffect } from 'react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import UnassignedResourcesSection from './UnassignedResourcesSection';
import { DutyWeekWidget } from './DutyWeekWidget';
import KanbanBoard from './KanbanBoard';
import AssignmentList from './AssignmentList';
import ViewToggle, { ViewMode } from './ViewToggle';
import { useUnifiedData } from '@/hooks/data/useUnifiedData';
import { useVacations } from '@/hooks/useVacations';

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
  weekDates
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
      
      {/* View Toggle */}
      <div className="flex items-center justify-start">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
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
