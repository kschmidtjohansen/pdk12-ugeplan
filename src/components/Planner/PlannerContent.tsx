import React, { useState, useMemo } from 'react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { groupAssignmentsByDay } from '@/utils/dateUtils';
import { format, parseISO } from 'date-fns';
import { getAllWeekDays } from '@/utils/dates';
import CurrentAndFutureDays from './CurrentAndFutureDays';
import PastAssignments from './PastAssignments';
import CompactCurrentAndFutureDays from './CompactCurrentAndFutureDays';
import CompactPastAssignments from './CompactPastAssignments';
import UnassignedResourcesSection from './UnassignedResourcesSection';
import { DutyWeekWidget } from './DutyWeekWidget';
import { useUnifiedData } from '@/hooks/data/useUnifiedData';
import { useVacations } from '@/hooks/useVacations';
import AssignmentDetailsDialog from '@/components/Dashboard/AssignmentDetailsDialog';

interface PlannerContentProps {
  weekAssignments: Assignment[];
  operationStates: Record<string, 'publishing' | 'deleting' | 'updating' | null>;
  expandedDays: Record<string, boolean>;
  onToggleExpansion: (date: string) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment: (assignmentId: string) => void;
  onPublishDay: (date: string) => void;
  onCreateAssignment: (date: string) => void;
  onCopyAssignment: (assignment: Assignment) => void;
  selectedWeek: number;
  selectedYear: number;
  weekDates: ReturnType<typeof import('@/utils/dates').getWeekDates>;
  viewMode?: 'standard' | 'compact';
}

const PlannerContent: React.FC<PlannerContentProps> = ({
  weekAssignments = [],
  operationStates = {},
  expandedDays,
  onToggleExpansion,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onPublishDay,
  onCreateAssignment,
  onCopyAssignment,
  selectedWeek,
  selectedYear,
  weekDates,
  viewMode = 'standard'
}) => {
  const { t } = useTranslation();
  const { canEdit, canPublishTasks } = usePermissions();
  const { isDutyEnabled } = useDepartment();
  
  const { employees, cars } = useUnifiedData();
  const { vacations } = useVacations();
  
  // State for assignment details dialog
  const [detailsDialogAssignment, setDetailsDialogAssignment] = useState<Assignment | null>(null);

  console.log(`[PlannerContent] Displaying ${weekAssignments.length} assignments with ${employees.length} employees and ${cars.length} cars`);

  // Group assignments by day
  const groupedAssignments = useMemo(() => {
    return groupAssignmentsByDay(weekAssignments || []);
  }, [weekAssignments]);

  // Generate dates array for the week
  const weekDateStrings = useMemo(() => {
    if (!weekDates?.start || !weekDates?.end) {
      console.error("Missing week dates in PlannerContent");
      return [];
    }
    return getAllWeekDays({
      start: weekDates.start,
      end: weekDates.end
    });
  }, [weekDates]);

  // Determine current date to split past and current/future days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Split dates into past and current/future
  const { pastDates, currentAndFutureDates } = useMemo(() => {
    if (!Array.isArray(weekDateStrings)) {
      return { pastDates: [], currentAndFutureDates: [] };
    }
    return weekDateStrings.reduce<{
      pastDates: string[];
      currentAndFutureDates: string[];
    }>((result, dateStr) => {
      if (typeof dateStr !== 'string') {
        console.error(`Invalid date string: ${dateStr}`);
        return result;
      }
      try {
        const date = parseISO(dateStr);
        if (date < today) {
          result.pastDates.push(dateStr);
        } else {
          result.currentAndFutureDates.push(dateStr);
        }
      } catch (error) {
        console.error(`Error parsing date: ${dateStr}`, error);
      }
      return result;
    }, { pastDates: [], currentAndFutureDates: [] });
  }, [weekDateStrings, today]);

  const hasNoAssignments = Array.isArray(weekAssignments) && weekAssignments.length === 0;

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
          {isDutyEnabled && (
            <div>
              <DutyWeekWidget
                selectedWeek={selectedWeek}
                selectedYear={selectedYear}
              />
            </div>
          )}
        </div>
      )}

      {/* Show empty state message if no assignments, but still render the days */}
      {hasNoAssignments && (
        <div className="text-center py-8 text-muted-foreground">
          {t("planner.noAssignmentsWeek")}
        </div>
      )}
      
      {/* Render view based on viewMode */}
      {viewMode === 'compact' ? (
        <>
          <CompactCurrentAndFutureDays 
            dates={currentAndFutureDates || []}
            groupedAssignments={groupedAssignments || {}}
            operationStates={operationStates}
            expandedDays={expandedDays}
            onToggleExpansion={onToggleExpansion}
            onPublishDay={onPublishDay}
            onEditAssignment={onEditAssignment}
            onDeleteAssignment={onDeleteAssignment}
            onPublishAssignment={onPublishAssignment}
            onCopyAssignment={onCopyAssignment}
            onViewAssignmentDetails={setDetailsDialogAssignment}
            canEdit={canEdit}
            canPublishTasks={canPublishTasks}
            cars={cars}
          />
          
          <CompactPastAssignments 
            pastDates={pastDates || []}
            groupedAssignments={groupedAssignments || {}}
            operationStates={operationStates}
            expandedDays={expandedDays}
            onToggleExpansion={onToggleExpansion}
            onPublishDay={onPublishDay}
            onEditAssignment={onEditAssignment}
            onDeleteAssignment={onDeleteAssignment}
            onPublishAssignment={onPublishAssignment}
            onCopyAssignment={onCopyAssignment}
            onViewAssignmentDetails={setDetailsDialogAssignment}
            canEdit={canEdit}
            canPublishTasks={canPublishTasks}
            cars={cars}
          />
        </>
      ) : (
        <>
          <CurrentAndFutureDays 
            dates={currentAndFutureDates || []}
            groupedAssignments={groupedAssignments || {}}
            allAssignments={weekAssignments}
            operationStates={operationStates}
            expandedDays={expandedDays}
            onToggleExpansion={onToggleExpansion}
            onPublishDay={onPublishDay}
            onEditAssignment={onEditAssignment}
            onDeleteAssignment={onDeleteAssignment}
            onPublishAssignment={onPublishAssignment}
            onCopyAssignment={onCopyAssignment}
            onViewDetails={setDetailsDialogAssignment}
            canEdit={canEdit}
            canPublishTasks={canPublishTasks}
            cars={cars}
          />
          
          <PastAssignments 
            pastDates={pastDates || []}
            groupedAssignments={groupedAssignments || {}}
            allAssignments={weekAssignments}
            operationStates={operationStates}
            expandedDays={expandedDays}
            onToggleExpansion={onToggleExpansion}
            onPublishDay={onPublishDay}
            onEditAssignment={onEditAssignment}
            onDeleteAssignment={onDeleteAssignment}
            onPublishAssignment={onPublishAssignment}
            onCopyAssignment={onCopyAssignment}
            onViewDetails={setDetailsDialogAssignment}
            canEdit={canEdit}
            canPublishTasks={canPublishTasks}
            cars={cars}
          />
        </>
      )}
      
      {/* Assignment Details Dialog for compact view */}
      {/* Assignment Details Dialog for both views */}
      <AssignmentDetailsDialog
        assignment={detailsDialogAssignment}
        isOpen={!!detailsDialogAssignment}
        onClose={() => setDetailsDialogAssignment(null)}
        cars={cars}
        onEdit={onEditAssignment}
      />
    </div>
  );
};

export default PlannerContent;