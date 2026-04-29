import React, { useMemo } from 'react';
import { getISOWeek, getISOWeekYear, startOfISOWeek, addWeeks, format } from 'date-fns';
import QuickAccessGrid from './QuickAccessGrid';
import CompactKpiStack from './CompactKpiStack';
import DutySummaryWidget from './DutySummaryWidget';
import UpcomingVacationsWidget from './UpcomingVacationsWidget';
import VacationNotificationsPanel from './VacationNotificationsPanel';
import WeeklyAssignments from './WeeklyAssignments';
import { useDepartment } from '@/context/DepartmentContext';
import { useAuth } from '@/context/AuthContext';
import { useVacations } from '@/hooks/useVacations';
import { useAssignments } from '@/hooks/useAssignments';

interface DashboardCockpitProps {
  showMetrics: boolean;
  showMyTasks: boolean;
  userRole?: string;
  selectedWeek: number;
  selectedYear: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

const DashboardCockpit: React.FC<DashboardCockpitProps> = ({
  showMetrics,
  showMyTasks,
  userRole,
  selectedWeek,
  selectedYear,
  onPreviousWeek,
  onNextWeek,
}) => {
  const { isDutyEnabled } = useDepartment();
  const { isEffectiveAdmin, user } = useAuth();
  const { vacations } = useVacations();
  const { assignments } = useAssignments();

  // Filter assignments for the selected ISO week
  const weekAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];
    return assignments.filter((a) => {
      const d = new Date(a.date);
      return getISOWeek(d) === selectedWeek && getISOWeekYear(d) === selectedYear;
    });
  }, [assignments, selectedWeek, selectedYear]);

  // Personal filter: only the user's own week (responsible OR assigned).
  // When showMyTasks is true (servicemedarbejder etc.), the top widget is
  // restricted to the current user — replacing the previous duplicate "Mine Opgaver".
  const personalWeekAssignments = useMemo(() => {
    if (!showMyTasks || !user?.id) return weekAssignments;
    return weekAssignments.filter((a) => {
      const isResp = (a.responsibleUser?.id ?? a.responsibleUserId) === user.id;
      const isAssignedNew = a.assignedEmployees?.some((e) => e.id === user.id) ?? false;
      const isAssignedLegacy = Array.isArray(a.employees) && a.employees.includes(user.id);
      return isResp || isAssignedNew || isAssignedLegacy;
    });
  }, [weekAssignments, showMyTasks, user?.id]);

  // Anchor KPI selectedDate to today if current week is selected, otherwise to Monday of selected week
  const kpiDate = useMemo(() => {
    const today = new Date();
    if (getISOWeek(today) === selectedWeek && getISOWeekYear(today) === selectedYear) {
      return format(today, 'yyyy-MM-dd');
    }
    const jan4 = new Date(selectedYear, 0, 4);
    const monday = startOfISOWeek(addWeeks(jan4, selectedWeek - 1));
    return format(monday, 'yyyy-MM-dd');
  }, [selectedWeek, selectedYear]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT — main work surface (2/3) */}
      <div className="lg:col-span-2 space-y-4 min-w-0">
        <QuickAccessGrid userRole={userRole} />
        <WeeklyAssignments
          assignments={personalWeekAssignments}
          selectedWeek={selectedWeek}
          selectedYear={selectedYear}
          onPreviousWeek={onPreviousWeek}
          onNextWeek={onNextWeek}
        />
      </div>

      {/* RIGHT — sticky cockpit panel (1/3) */}
      <aside className="space-y-4 lg:sticky lg:top-14 lg:self-start">
        {showMetrics && <CompactKpiStack selectedDate={kpiDate} />}
        {showMetrics && isEffectiveAdmin && <VacationNotificationsPanel />}
        {isDutyEnabled && <DutySummaryWidget />}
        <UpcomingVacationsWidget vacations={vacations} />
      </aside>
    </div>
  );
};

export default DashboardCockpit;
