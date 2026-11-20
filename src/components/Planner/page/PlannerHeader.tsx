import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Monitor, LayoutGrid, LayoutList, List, CalendarDays, Columns3, Map as MapIcon } from 'lucide-react';
import { SlidingSegments } from '@/components/ui/sliding-segments';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import type { getWeekDates } from '@/utils/dates';
import { todayLocalYYYYMMDD } from '@/utils/dateUtils';

export type PlannerViewMode = 'board' | 'standard' | 'compact' | 'grid' | 'calendar' | 'map';
const LIST_MODES: PlannerViewMode[] = ['standard', 'compact', 'grid'];

interface Props {
  selectedWeek: number;
  selectedYear: number;
  weekDates: ReturnType<typeof getWeekDates>;
  viewMode: PlannerViewMode;
  setViewMode: (v: PlannerViewMode) => void;
  handlePreviousWeek: () => void;
  handleNextWeek: () => void;
  handlePrefetchAssignments: () => void;
  handleCancelPrefetch: () => void;
  handleShowOnScreen: () => void;
  handleOpenCreateDialog: (date: string) => void;
  onCurrentWeek: () => void;
  filters?: React.ReactNode;
  /** Issue chips (Alle, Ikke publiceret, Uden medarbejder, Konflikter) shown under the title. */
  chips?: React.ReactNode;
}

/** "16.–22. november 2026" (or across months: "30. nov. – 6. dec. 2026"). */
const formatWeekRange = (start: Date, end: Date, locale: string) => {
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}.–${end.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

/** Lærredets hoved for Ugeplan: uge og datoer, ugeskift, visning (Tavle, Liste, Kalender, Kort), filtre og forklaring. */
const PlannerHeader: React.FC<Props> = ({
  selectedWeek, selectedYear, weekDates, viewMode, setViewMode, handlePreviousWeek, handleNextWeek,
  handlePrefetchAssignments, handleCancelPrefetch, handleShowOnScreen, handleOpenCreateDialog,
  onCurrentWeek, filters, chips,
}) => {
  const { t, currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const { canCreate, canPublishTasks } = usePermissions();
  const isList = LIST_MODES.includes(viewMode);
  const [lastList, setLastList] = React.useState<PlannerViewMode>(isList ? viewMode : 'standard');
  React.useEffect(() => { if (isList) setLastList(viewMode); }, [isList, viewMode]);
  const main = isList ? 'list' : viewMode;
  const listToggle = 'h-8 w-8 min-h-0 min-w-0 rounded-full p-0 text-muted-foreground data-[state=on]:bg-accent data-[state=on]:text-primary-strong';
  return (
        <header className="space-y-3">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            <div className="flex min-w-0 flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {weekDates?.start && weekDates?.end ? formatWeekRange(weekDates.start, weekDates.end, da ? 'da-DK' : 'en-GB') : t('navigation.planner')}
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                <span className="sr-only">{t("navigation.planner")}, </span>{t('planner.week')} {selectedWeek}
                {selectedYear !== new Date().getFullYear() && <span className="ml-2 text-xl font-semibold text-muted-foreground sm:text-2xl">{selectedYear}</span>}
              </h1>
            </div>
            <div className="mb-1 flex items-center gap-1.5">
              <Button aria-label={t('planner.previousWeek')} variant="outline" size="sm" onClick={handlePreviousWeek} onMouseEnter={handlePrefetchAssignments} onMouseLeave={handleCancelPrefetch} className="h-9 w-9 rounded-full border-border/70 p-0 shadow-flade"><ChevronLeft className="h-4 w-4" /></Button>
              <Button aria-label={t('planner.nextWeek')} variant="outline" size="sm" onClick={handleNextWeek} onMouseEnter={handlePrefetchAssignments} onMouseLeave={handleCancelPrefetch} className="h-9 w-9 rounded-full border-border/70 p-0 shadow-flade"><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="h-9 rounded-full px-3 text-xs font-semibold" onClick={onCurrentWeek}>{t('planner.operationsOverview.currentWeek')}</Button>
              {canPublishTasks && (
                <Button onClick={handleShowOnScreen} variant="ghost" size="sm" aria-label={t('planner.showOnScreen')} title={t('planner.showOnScreen')} className="h-9 w-9 rounded-full p-0"><Monitor className="h-4 w-4" /></Button>
              )}
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              {isList && (
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as PlannerViewMode)} className="rounded-full border border-border/70 bg-card/80 p-1 shadow-flade" aria-label={da ? 'Listetype' : 'List style'}>
                  <ToggleGroupItem value="standard" size="sm" aria-label={t('planner.viewModeStandard')} title={t('planner.viewModeStandard')} className={listToggle}><List className="h-3.5 w-3.5" /></ToggleGroupItem>
                  <ToggleGroupItem value="grid" size="sm" aria-label={da ? 'Gitter' : 'Grid'} title={da ? 'Gitter' : 'Grid'} className={listToggle}><LayoutGrid className="h-3.5 w-3.5" /></ToggleGroupItem>
                  <ToggleGroupItem value="compact" size="sm" aria-label={t('planner.viewModeCompact')} title={t('planner.viewModeCompact')} className={listToggle}><LayoutList className="h-3.5 w-3.5" /></ToggleGroupItem>
                </ToggleGroup>
              )}
              <SlidingSegments ariaLabel={da ? 'Visning' : 'View'} value={main} onChange={(v) => setViewMode(v === 'list' ? lastList : v as PlannerViewMode)}
                segments={[
                  { key: 'board', label: <><Columns3 aria-hidden className="h-3.5 w-3.5" />{da ? 'Tavle' : 'Board'}</> },
                  { key: 'list', label: <><List aria-hidden className="h-3.5 w-3.5" />{da ? 'Liste' : 'List'}</> },
                  { key: 'calendar', label: <><CalendarDays aria-hidden className="h-3.5 w-3.5" />{da ? 'Kalender' : 'Calendar'}</> },
                  { key: 'map', label: <><MapIcon aria-hidden className="h-3.5 w-3.5" />{da ? 'Kort' : 'Map'}</> },
                ]} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {chips}
            {filters && <div className="w-full lg:ml-auto lg:w-auto lg:min-w-[22rem] lg:max-w-xl">{filters}</div>}
            {canCreate && (
              <Button
                className="min-h-11 min-w-11 shrink-0 rounded-full px-3 md:hidden"
                aria-label={t('planner.newAssignment')}
                title={t('planner.newAssignment')}
                onClick={() => handleOpenCreateDialog(todayLocalYYYYMMDD())}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </header>
  );
};

interface NavProps {
  selectedWeek: number;
  handlePreviousWeek: () => void;
  handleNextWeek: () => void;
  handlePrefetchAssignments: () => void;
  handleCancelPrefetch: () => void;
  onCurrentWeek: () => void;
  onShowOnScreen?: () => void;
}

/** Week stepper + "this week" shortcut, rendered inside the "Ugens plan" strip. */
export const PlannerWeekNav: React.FC<NavProps> = ({ selectedWeek, handlePreviousWeek, handleNextWeek, handlePrefetchAssignments, handleCancelPrefetch, onCurrentWeek, onShowOnScreen }) => {
  const { t } = useTranslation();
  const { canPublishTasks } = usePermissions();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center justify-center gap-1 rounded-full border border-border/70 bg-card p-1 shadow-flade">
        <Button aria-label={t('planner.previousWeek')} variant="ghost" size="sm" onClick={handlePreviousWeek} onMouseEnter={handlePrefetchAssignments} onMouseLeave={handleCancelPrefetch} className="h-10 w-10 rounded-full p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[80px] text-center font-display text-sm font-semibold text-foreground">
          {t('planner.week')} {selectedWeek}
        </span>
        <Button aria-label={t('planner.nextWeek')} variant="ghost" size="sm" onClick={handleNextWeek} onMouseEnter={handlePrefetchAssignments} onMouseLeave={handleCancelPrefetch} className="h-10 w-10 rounded-full p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="outline" className="min-h-11 rounded-full shadow-flade" onClick={onCurrentWeek}>{t('planner.operationsOverview.currentWeek')}</Button>
      {canPublishTasks && onShowOnScreen && (
        <Button onClick={onShowOnScreen} variant="outline" size="sm" aria-label={t('planner.showOnScreen')} title={t('planner.showOnScreen')} className="h-11 w-11 rounded-full p-0 shadow-flade">
          <Monitor className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default PlannerHeader;
