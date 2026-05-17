import React, { useState, useMemo, Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { groupAssignmentsByDay } from '@/utils/dateUtils';
import { parseISO } from 'date-fns';
import { getAllWeekDays } from '@/utils/dates';
import CurrentAndFutureDays from './CurrentAndFutureDays';
import PastAssignments from './PastAssignments';
import CompactCurrentAndFutureDays from './CompactCurrentAndFutureDays';
import CompactPastAssignments from './CompactPastAssignments';
import UnassignedResourcesSection from './UnassignedResourcesSection';
import { useUnifiedData } from '@/hooks/data/useUnifiedData';
import { useVacations } from '@/hooks/useVacations';
const AssignmentDetailsDialog = lazy(() => import('@/components/Dashboard/AssignmentDetailsDialog'));
import { PlannerWidgetErrorBoundary } from '@/components/ErrorBoundary/PlannerWidgetErrorBoundary';
import { getSeriesSiblingIds } from '@/utils/assignmentSeries';

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
  onCopyDayFromYesterday?: (date: string) => void;
  selectedWeek: number;
  selectedYear: number;
  weekDates: ReturnType<typeof import('@/utils/dates').getWeekDates>;
  viewMode?: 'standard' | 'compact' | 'grid';
  selectedIds?: Set<string>;
  selectionActive?: boolean;
  onToggleSelect?: (id: string, ev: React.MouseEvent | React.KeyboardEvent) => void;
  allExpanded?: boolean;
  onToggleAllExpanded?: () => void;
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
  onCopyDayFromYesterday,
  selectedWeek,
  selectedYear,
  weekDates,
  viewMode = 'standard',
  selectedIds,
  selectionActive = false,
  onToggleSelect,
  allExpanded = false,
  onToggleAllExpanded,
}) => {
  const { t, currentLanguage } = useTranslation();
  const { canEdit, canPublishTasks } = usePermissions();
  
  const { employees, cars, assignments: allAssignments } = useUnifiedData();
  const { vacations } = useVacations();
  
  // State for assignment details dialog
  const [detailsDialogAssignment, setDetailsDialogAssignment] = useState<Assignment | null>(null);

  // Compute sibling IDs (all days in same case series) for the open assignment
  const detailsSiblingIds = useMemo(
    () => getSeriesSiblingIds(detailsDialogAssignment, allAssignments),
    [detailsDialogAssignment, allAssignments]
  );

  if (import.meta.env.DEV) console.log(`[PlannerContent] Displaying ${weekAssignments.length} assignments with ${employees.length} employees and ${cars.length} cars`);

  // Group assignments by day
  const groupedAssignments = useMemo(() => {
    return groupAssignmentsByDay(weekAssignments || []);
  }, [weekAssignments]);

  // Generate dates array for the week
  const weekDateStrings = useMemo(() => {
    if (!weekDates?.start || !weekDates?.end) {
      if (import.meta.env.DEV) console.error("Missing week dates in PlannerContent");
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
        if (import.meta.env.DEV) console.error(`Invalid date string: ${dateStr}`);
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
        if (import.meta.env.DEV) console.error(`Error parsing date: ${dateStr}`, error);
      }
      return result;
    }, { pastDates: [], currentAndFutureDates: [] });
  }, [weekDateStrings, today]);

  const hasNoAssignments = Array.isArray(weekAssignments) && weekAssignments.length === 0;

  return (
    <div className="space-y-4 pb-4">
      {/* Unassigned Resources */}
      {(canEdit || canPublishTasks) && (
        <PlannerWidgetErrorBoundary label="Unassigned Resources">
          <UnassignedResourcesSection
            assignments={weekAssignments}
            employees={employees}
            cars={cars}
            vacations={vacations}
            weekDates={weekDates}
          />
        </PlannerWidgetErrorBoundary>
      )}

      {/* Expand/Collapse all — sits with the day list */}
      {onToggleAllExpanded && viewMode !== 'compact' && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAllExpanded}
            className="h-7 px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 mr-1.5" />
            {allExpanded
              ? (currentLanguage === 'da' ? 'Fold sammen' : 'Collapse all')
              : (currentLanguage === 'da' ? 'Udvid alle' : 'Expand all')}
          </Button>
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
          <PlannerWidgetErrorBoundary label="Current & Future">
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
          </PlannerWidgetErrorBoundary>

          <PlannerWidgetErrorBoundary label="Past Days">
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
          </PlannerWidgetErrorBoundary>
        </>
      ) : (
        <>
          <PlannerWidgetErrorBoundary label="Current & Future">
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
              onCreateAssignment={onCreateAssignment}
              onCopyDayFromYesterday={onCopyDayFromYesterday}
              canEdit={canEdit}
              canPublishTasks={canPublishTasks}
              cars={cars}
              gridLayout={viewMode === 'grid'}
              selectedIds={selectedIds}
              selectionActive={selectionActive}
              onToggleSelect={onToggleSelect}
            />
          </PlannerWidgetErrorBoundary>

          <PlannerWidgetErrorBoundary label="Past Days">
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
              gridLayout={viewMode === 'grid'}
              selectedIds={selectedIds}
              selectionActive={selectionActive}
              onToggleSelect={onToggleSelect}
            />
          </PlannerWidgetErrorBoundary>
        </>
      )}
      
      {/* Assignment Details Dialog for compact view */}
      {/* Assignment Details Dialog for both views */}
      {detailsDialogAssignment && (
        <Suspense fallback={null}>
          <AssignmentDetailsDialog
            assignment={detailsDialogAssignment}
            isOpen={!!detailsDialogAssignment}
            onClose={() => setDetailsDialogAssignment(null)}
            cars={cars}
            onEdit={onEditAssignment}
            siblingAssignmentIds={detailsSiblingIds}
          />
        </Suspense>
      )}
    </div>
  );
};

export default PlannerContent;