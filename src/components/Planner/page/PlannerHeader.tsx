import React from 'react';
import { Clock, ChevronLeft, ChevronRight, Plus, Monitor, LayoutGrid, LayoutList, List, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import type { getWeekDates } from '@/utils/dates';

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
}

/** Title, view-mode toggle, week navigation and primary actions for the weekly planner. */
const PlannerHeader: React.FC<Props> = ({
  selectedWeek, selectedYear, weekDates, viewMode, setViewMode, handlePreviousWeek, handleNextWeek,
  handlePrefetchAssignments, handleCancelPrefetch, handleShowOnScreen, handleOpenCreateDialog,
}) => {
  const { t, currentLanguage } = useTranslation();
  const { canCreate, canPublishTasks } = usePermissions();
  return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Clock className="h-4 w-4" />
            </div>
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center justify-center sm:justify-start">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as PlannerViewMode)}
                className="bg-muted/50 border border-border rounded-lg p-0.5"
              >
                <ToggleGroupItem value="standard" size="sm" aria-label={t('planner.viewModeStandard')} title={t('planner.viewModeStandard')} className="h-9 w-9 sm:h-7 sm:w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                  <List className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" size="sm" aria-label={currentLanguage === 'da' ? 'Gitter' : 'Grid'} title={currentLanguage === 'da' ? 'Gitter' : 'Grid'} className="h-9 w-9 sm:h-7 sm:w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="compact" size="sm" aria-label={t('planner.viewModeCompact')} title={t('planner.viewModeCompact')} className="h-9 w-9 sm:h-7 sm:w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                  <LayoutList className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="calendar" size="sm" aria-label={currentLanguage === 'da' ? 'Kalender' : 'Calendar'} title={currentLanguage === 'da' ? 'Kalender (Outlook)' : 'Calendar'} className="h-9 w-9 sm:h-7 sm:w-7 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-1 py-1">
                <Button variant="ghost" size="sm" onClick={handlePreviousWeek} onMouseEnter={handlePrefetchAssignments} onMouseLeave={handleCancelPrefetch} className="h-7 w-7 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[80px] text-center text-sm text-foreground">
                  {t('planner.week')} {selectedWeek}
                </span>
                <Button variant="ghost" size="sm" onClick={handleNextWeek} onMouseEnter={handlePrefetchAssignments} onMouseLeave={handleCancelPrefetch} className="h-7 w-7 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {canPublishTasks && (
                <Button onClick={handleShowOnScreen} variant="outline" size="sm" aria-label={t('planner.showOnScreen')} title={t('planner.showOnScreen')} className="h-8 w-8 p-0">
                  <Monitor className="h-4 w-4" />
                </Button>
              )}
              {canCreate && (
                <Button onClick={() => handleOpenCreateDialog(new Date().toISOString().split('T')[0])} size="sm">
                  <Plus className="h-4 w-4" />
                  {t('planner.newAssignment')}
                </Button>
              )}
            </div>
          </div>
        </div>
  );
};

export default PlannerHeader;
