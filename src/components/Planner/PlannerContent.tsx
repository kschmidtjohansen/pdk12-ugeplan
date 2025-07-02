
import React, { useState, useMemo } from 'react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { groupAssignmentsByDay } from '@/utils/dateUtils';
import { format, parseISO } from 'date-fns';
import { getAllWeekDays } from '@/utils/dates';
import CurrentAndFutureDays from './CurrentAndFutureDays';
import PastAssignments from './PastAssignments';
import EmptyState from './EmptyState';
import UnassignedResourcesSection from './UnassignedResourcesSection';
// Fix the import path
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

  // State to track which days are expanded
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // Toggle expansion of a day section
  const handleToggleExpansion = (date: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !(prev[date] ?? true)
    }));
  };

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

  if (Array.isArray(weekAssignments) && weekAssignments.length === 0) {
    return <EmptyState message={t("planner.noAssignmentsWeek")} />;
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Unassigned Resources Section */}
      {(canEdit || canPublishTasks) && (
        <UnassignedResourcesSection 
          assignments={weekAssignments}
          employees={employees}
          cars={cars}
          vacations={vacations}
        />
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
      
      <CurrentAndFutureDays 
        dates={currentAndFutureDates || []}
        groupedAssignments={groupedAssignments || {}}
        operationStates={operationStates}
        expandedDays={expandedDays}
        onToggleExpansion={handleToggleExpansion}
        onPublishDay={onPublishDay}
        onEditAssignment={onEditAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onPublishAssignment={onPublishAssignment}
        onCopyAssignment={onCopyAssignment}
        canEdit={canEdit}
        canPublishTasks={canPublishTasks}
        cars={cars}
      />
      
      <PastAssignments 
        pastDates={pastDates || []}
        groupedAssignments={groupedAssignments || {}}
        operationStates={operationStates}
        expandedDays={expandedDays}
        onToggleExpansion={handleToggleExpansion}
        onPublishDay={onPublishDay}
        onEditAssignment={onEditAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onPublishAssignment={onPublishAssignment}
        onCopyAssignment={onCopyAssignment}
        canEdit={canEdit}
        canPublishTasks={canPublishTasks}
        cars={cars}
      />
    </div>
  );
};

export default PlannerContent;
