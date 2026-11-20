import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Monitor, LayoutGrid, LayoutList, List, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import type { getWeekDates } from '@/utils/dates';
import { todayLocalYYYYMMDD } from '@/utils/dateUtils';

export type PlannerViewMode = 'standard' | 'compact' | 'grid' | 'calendar';

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
}

/** "16.–22. november 2026" (or across months: "30. nov. – 6. dec. 2026"). */
const formatWeekRange = (start: Date, end: Date, locale: string) => {
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}.–${end.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

/** Title, view-mode toggle, week navigation and primary actions for the weekly planner. */
const PlannerHeader: React.FC<Props> = ({
  selectedWeek, selectedYear, weekDates, viewMode, setViewMode, handlePreviousWeek, handleNextWeek,
  handlePrefetchAssignments, handleCancelPrefetch, handleShowOnScreen, handleOpenCreateDialog,
  onCurrentWeek, filters,
}) => {
  const { t, currentLanguage } = useTranslation();
  const { canCreate, canPublishTasks } = usePermissions();
  return (
        <header className="space-y-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {t("navigation.planner")}{weekDates?.start && weekDates?.end && <> · {formatWeekRange(weekDates.start, weekDates.end, currentLanguage === 'da' ? 'da-DK' : 'en-GB')}</>}
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              <span className="sr-only">{t("navigation.planner")}, </span>{t('planner.week')} {selectedWeek}
              {selectedYear !== new Date().getFullYear() && <span className="ml-2 text-xl font-semibold text-muted-foreground sm:text-2xl">{selectedYear}</span>}
            </h1>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex items-center justify-center sm:justify-start">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as PlannerViewMode)}
                className="rounded-full border border-border/70 bg-card/80 p-1 shadow-flade"
              >
                <ToggleGroupItem value="standard" size="sm" aria-label={t('planner.viewModeStandard')} title={`${t('planner.viewModeStandard')} (1)`} className="h-9 w-9 min-h-0 min-w-0 rounded-full p-0 text-muted-foreground transition-[background-color,color,box-shadow] duration-140 ease-facet data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-brand">
                  <List className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" size="sm" aria-label={currentLanguage === 'da' ? 'Gitter' : 'Grid'} title={currentLanguage === 'da' ? 'Gitter (2)' : 'Grid (2)'} className="h-9 w-9 min-h-0 min-w-0 rounded-full p-0 text-muted-foreground transition-[background-color,color,box-shadow] duration-140 ease-facet data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-brand">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="compact" size="sm" aria-label={t('planner.viewModeCompact')} title={`${t('planner.viewModeCompact')} (3)`} className="h-9 w-9 min-h-0 min-w-0 rounded-full p-0 text-muted-foreground transition-[background-color,color,box-shadow] duration-140 ease-facet data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-brand">
                  <LayoutList className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="calendar" size="sm" aria-label={currentLanguage === 'da' ? 'Kalender' : 'Calendar'} title={currentLanguage === 'da' ? 'Kalender (4)' : 'Calendar (4)'} className="h-9 w-9 min-h-0 min-w-0 rounded-full p-0 text-muted-foreground transition-[background-color,color,box-shadow] duration-140 ease-facet data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-brand">
                  <CalendarDays className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {filters && <div className="min-w-[240px] flex-1">{filters}</div>}
            {canCreate && (
              <Button
                className="ml-auto min-h-11 min-w-11 shrink-0 self-start px-3 sm:px-4"
                aria-label={t('planner.newAssignment')}
                title={t('planner.newAssignment')}
                onClick={() => handleOpenCreateDialog(todayLocalYYYYMMDD())}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('planner.newAssignment')}</span>
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
