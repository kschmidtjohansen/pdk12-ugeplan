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

/** Title, view-mode toggle, week navigation and primary actions for the weekly planner. */
const PlannerHeader: React.FC<Props> = ({
  selectedWeek, selectedYear, weekDates, viewMode, setViewMode, handlePreviousWeek, handleNextWeek,
  handlePrefetchAssignments, handleCancelPrefetch, handleShowOnScreen, handleOpenCreateDialog,
  onCurrentWeek, filters,
}) => {
  const { t, currentLanguage } = useTranslation();
  const { canCreate, canPublishTasks } = usePermissions();
  return (
        <header className="space-y-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
              {t("navigation.planner")}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {t('planner.weekView', {
                week: selectedWeek,
                year: selectedYear,
                start: weekDates?.start ? weekDates.start.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB') : '',
                end: weekDates?.end ? weekDates.end.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB') : ''
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex items-center justify-center sm:justify-start pt-1.5">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as PlannerViewMode)}
                className="bg-muted/50 border border-border rounded-lg p-0.5"
              >
                <ToggleGroupItem value="standard" size="sm" aria-label={t('planner.viewModeStandard')} title={t('planner.viewModeStandard')} className="h-8 w-8 min-h-0 min-w-0 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                  <List className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" size="sm" aria-label={currentLanguage === 'da' ? 'Gitter' : 'Grid'} title={currentLanguage === 'da' ? 'Gitter' : 'Grid'} className="h-8 w-8 min-h-0 min-w-0 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="compact" size="sm" aria-label={t('planner.viewModeCompact')} title={t('planner.viewModeCompact')} className="h-8 w-8 min-h-0 min-w-0 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                  <LayoutList className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="calendar" size="sm" aria-label={currentLanguage === 'da' ? 'Kalender' : 'Calendar'} title={currentLanguage === 'da' ? 'Kalender (Outlook)' : 'Calendar'} className="h-8 w-8 min-h-0 min-w-0 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {filters && <div className="min-w-0 flex-1">{filters}</div>}
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
      <div className="flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-1 py-1">
        <Button aria-label={t('planner.previousWeek')} variant="ghost" size="sm" onClick={handlePreviousWeek} onMouseEnter={handlePrefetchAssignments} onMouseLeave={handleCancelPrefetch} className="h-11 w-11 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium min-w-[80px] text-center text-sm text-foreground">
          {t('planner.week')} {selectedWeek}
        </span>
        <Button aria-label={t('planner.nextWeek')} variant="ghost" size="sm" onClick={handleNextWeek} onMouseEnter={handlePrefetchAssignments} onMouseLeave={handleCancelPrefetch} className="h-11 w-11 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="outline" className="min-h-11" onClick={onCurrentWeek}>{t('planner.operationsOverview.currentWeek')}</Button>
      {canPublishTasks && onShowOnScreen && (
        <Button onClick={onShowOnScreen} variant="outline" size="sm" aria-label={t('planner.showOnScreen')} title={t('planner.showOnScreen')} className="h-11 w-11 p-0">
          <Monitor className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default PlannerHeader;
