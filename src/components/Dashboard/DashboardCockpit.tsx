import React, { useMemo, useState } from 'react';
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, addWeeks, format } from 'date-fns';
import TodayGuardsWidget from './TodayGuardsWidget';
import CompactKpiStack from './CompactKpiStack';
import UpcomingVacationsWidget from './UpcomingVacationsWidget';
import TodayTimeline from './TodayTimeline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeeklyAssignments from './WeeklyAssignments';
import ListSkeleton from '@/components/shared/ListSkeleton';
import { assignmentsInWeek } from '@/utils/plannerOperations';
import { useAuth, usePermissions } from '@/context/AuthContext';
import { useVacations } from '@/hooks/useVacations';
import { useAssignments } from '@/hooks/useAssignments';
import { useTranslation } from '@/context/TranslationContext';

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
  const { user } = useAuth();
  const { t } = useTranslation();
  const { canSeeUnpublishedTasks } = usePermissions();
  const { canSeeUnpublishedTasks } = usePermissions();
  const { vacations } = useVacations();
  const { vacations } = useVacations();
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignments();
  const [tab, setTab] = useState<string>(() => localStorage.getItem('dashboardTab') || 'today');
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = useState(false);
  const changeTab = (v: string) => { setTab(v); localStorage.setItem('dashboardTab', v); };

  const weekAssignments = useMemo(() => assignmentsInWeek(assignments || [], selectedWeek, selectedYear), [assignments, selectedWeek, selectedYear]);
  const weekSummary = useMemo(() => summarizeWeek(weekAssignments, employees, cars), [weekAssignments, employees, cars]);
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

  // Full ISO-week range so kursus/fravær opdages overalt i den valgte uge.
  const kpiWeekRange = useMemo(() => {
    const jan4 = new Date(selectedYear, 0, 4);
    const monday = startOfISOWeek(addWeeks(jan4, selectedWeek - 1));
    const sunday = endOfISOWeek(monday);
    return { startStr: format(monday, 'yyyy-MM-dd'), endStr: format(sunday, 'yyyy-MM-dd') };
  }, [selectedWeek, selectedYear]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      {/* LEFT — main work surface (2/3) */}
      <div className="min-w-0 space-y-4">
        {canSeeUnpublishedTasks && userRole !== 'servicemedarbejder' && <WeekOperationsStrip attention summary={weekSummary} week={selectedWeek} loading={assignmentsLoading} error={!!assignmentsError} onSelect={issue => navigate(plannerOperationsLink(selectedWeek, selectedYear, issue))} />}
        <Tabs value={tab} onValueChange={changeTab}>
          <TabsList className="mb-4 grid w-full grid-cols-2 sm:flex sm:w-auto">
            <TabsTrigger value="today" className="min-h-11 px-4">{t('ui.tabToday')}</TabsTrigger>
            <TabsTrigger value="week" className="min-h-11 px-4">{t('ui.tabWeekOverview')}</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="mt-0">
            <TodayTimeline active={tab === 'today'} />
          </TabsContent>
          <TabsContent value="week" className="mt-0">
            {assignmentsLoading && personalWeekAssignments.length === 0 ? (
              <ListSkeleton variant="card" rowCount={3} />
            ) : (
              <WeeklyAssignments
                assignments={personalWeekAssignments}
                selectedWeek={selectedWeek}
                selectedYear={selectedYear}
                onPreviousWeek={onPreviousWeek}
                onNextWeek={onNextWeek}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* RIGHT — sticky cockpit panel (1/3) */}
      {isMobile ? (
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-muted px-3 py-3 text-sm font-semibold text-foreground">
            {t('ui.moreKpisDutiesVacations')}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
        {showMetrics && <CompactKpiStack selectedDate={kpiDate} weekRange={kpiWeekRange} />}
        <UpcomingVacationsWidget vacations={vacations} />
        <TodayGuardsWidget />
          </CollapsibleContent>
        </Collapsible>
      ) : (
      <aside className="space-y-4 pt-4 xl:pt-0 xl:sticky xl:top-36 xl:self-start">
        {showMetrics && <CompactKpiStack selectedDate={kpiDate} weekRange={kpiWeekRange} />}
        <UpcomingVacationsWidget vacations={vacations} />
        <TodayGuardsWidget />
      </aside>
      )}
    </div>
  );
};

export default DashboardCockpit;
