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
  const { user } = useAuth();
  const { vacations } = useVacations();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const [tab, setTab] = useState<string>(() => localStorage.getItem('dashboardTab') || 'today');
  const isMobile = useIsMobile();
  const [moreOpen, setMoreOpen] = useState(false);
  const changeTab = (v: string) => { setTab(v); localStorage.setItem('dashboardTab', v); };

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

  // Full ISO-week range so kursus/fravær opdages overalt i den valgte uge.
  const kpiWeekRange = useMemo(() => {
    const jan4 = new Date(selectedYear, 0, 4);
    const monday = startOfISOWeek(addWeeks(jan4, selectedWeek - 1));
    const sunday = endOfISOWeek(monday);
    return { startStr: format(monday, 'yyyy-MM-dd'), endStr: format(sunday, 'yyyy-MM-dd') };
  }, [selectedWeek, selectedYear]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT — main work surface (2/3) */}
      <div className="lg:col-span-2 min-w-0">
        <Tabs value={tab} onValueChange={changeTab}>
          <TabsList className="sticky top-14 z-10 mb-3 grid h-11 w-full grid-cols-2 rounded-lg border border-border/60 bg-card/90 p-1 backdrop-blur sm:static sm:inline-flex sm:h-10 sm:w-auto">
            <TabsTrigger value="today" className="h-9 px-4 sm:h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">I dag</TabsTrigger>
            <TabsTrigger value="week" className="h-9 px-4 sm:h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ugens overblik</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="mt-0 rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur sm:p-4">
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
          <CollapsibleTrigger className="flex h-11 w-full items-center justify-between rounded-xl border border-border/60 bg-card/70 px-4 text-sm font-medium text-foreground">
            Mere: nøgletal, vagter og ferier
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
        {showMetrics && <CompactKpiStack selectedDate={kpiDate} weekRange={kpiWeekRange} />}
        <TodayGuardsWidget />
        <UpcomingVacationsWidget vacations={vacations} />
          </CollapsibleContent>
        </Collapsible>
      ) : (
      <aside className="space-y-4 lg:sticky lg:top-14 lg:self-start">
        {showMetrics && <CompactKpiStack selectedDate={kpiDate} weekRange={kpiWeekRange} />}
        <TodayGuardsWidget />
        <UpcomingVacationsWidget vacations={vacations} />
      </aside>
      )}
    </div>
  );
};

export default DashboardCockpit;
