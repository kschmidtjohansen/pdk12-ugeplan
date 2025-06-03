
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
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';

interface PlannerContentProps {
  weekAssignments: Assignment[];
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment: (assignmentId: string) => void;
  onPublishDay: () => void;
  onCreateAssignment: (date: string) => void;
  onCopyAssignment: (assignment: Assignment) => void;
  selectedWeek: number;
  selectedYear: number;
  weekDates: ReturnType<typeof import('@/utils/dates').getWeekDates>;
}

const PlannerContent: React.FC<PlannerContentProps> = ({
  weekAssignments = [],
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
  const { employees } = useEmployees();
  const { cars } = useCars();

  // DEBUGGING: Log assignments received by PlannerContent
  console.log(`[PlannerContent] Received ${weekAssignments.length} week assignments:`);
  weekAssignments.forEach((assignment: Assignment, index: number) => {
    console.log(`  Assignment ${index + 1}: ${assignment.location}`);
    console.log(`    - ID: ${assignment.id}`);
    console.log(`    - Employees:`, assignment.employees);
    console.log(`    - Employee count:`, assignment.employees?.length || 0);
    console.log(`    - Published:`, assignment.published);
    console.log(`    - Assignment object:`, assignment);
  });

  const isMobile = window.innerWidth < 768;

  // Group assignments by day
  const groupedAssignments = useMemo(() => {
    const grouped = groupAssignmentsByDay(weekAssignments || []);
    
    // DEBUGGING: Log grouped assignments
    console.log(`[PlannerContent] Grouped assignments:`, grouped);
    Object.entries(grouped).forEach(([date, assignments]: [string, Assignment[]]) => {
      console.log(`  Date ${date}: ${assignments.length} assignments`);
      assignments.forEach((assignment: Assignment, index: number) => {
        console.log(`    Assignment ${index + 1}: ${assignment.location}`);
        console.log(`      - Employees:`, assignment.employees);
        console.log(`      - Employee count:`, assignment.employees?.length || 0);
      });
    });
    
    return grouped;
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
  const todayStr = format(today, 'yyyy-MM-dd');

  // Split dates into past and current/future
  const { pastDates, currentAndFutureDates } = useMemo(() => {
    if (!Array.isArray(weekDateStrings)) {
      return {
        pastDates: [],
        currentAndFutureDates: []
      };
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
    }, {
      pastDates: [],
      currentAndFutureDates: []
    });
  }, [weekDateStrings, today]);

  if (Array.isArray(weekAssignments) && weekAssignments.length === 0 && !canEdit) {
    return <EmptyState message={t("planner.noAssignmentsWeek")} />;
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Unassigned Resources Section for admin/skadeleder only */}
      {(canEdit || canPublishTasks) && (
        <UnassignedResourcesSection 
          assignments={weekAssignments} 
          employees={employees} 
          cars={cars} 
        />
      )}
      
      <CurrentAndFutureDays 
        dates={currentAndFutureDates || []} 
        groupedAssignments={groupedAssignments || {}} 
        expandedDays={expandedDays} 
        onToggleExpansion={handleToggleExpansion} 
        onPublishDay={onPublishDay} 
        onEditAssignment={onEditAssignment} 
        onDeleteAssignment={onDeleteAssignment} 
        onPublishAssignment={onPublishAssignment} 
        onCopyAssignment={onCopyAssignment} 
        canEdit={canEdit} 
        canPublishTasks={canPublishTasks} 
      />
      
      <PastAssignments 
        pastDates={pastDates || []} 
        groupedAssignments={groupedAssignments || {}} 
        expandedDays={expandedDays} 
        onToggleExpansion={handleToggleExpansion} 
        onPublishDay={onPublishDay} 
        onEditAssignment={onEditAssignment} 
        onDeleteAssignment={onDeleteAssignment} 
        onPublishAssignment={onPublishAssignment} 
        onCopyAssignment={onCopyAssignment} 
        canEdit={canEdit} 
        canPublishTasks={canPublishTasks} 
      />
    </div>
  );
};

export default PlannerContent;
