
import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock, ArrowRight, UserCheck, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/context/TranslationContext';
import { useCars } from '@/hooks/car';
import { useEmployees } from '@/hooks/useEmployees';
import { useVacations } from '@/hooks/useVacations';
import { useOptimizedAssignments } from '@/hooks/useOptimizedAssignments';
import { usePermissions } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { filterDisplayNames } from '@/utils/people';
import WeekNavigation from './WeekNavigation';
import AssignmentDetailsDialog from './AssignmentDetailsDialog';
import AssignmentDialogManager from '@/components/Planner/AssignmentDialogManager';
import { getSeriesSiblingIds } from '@/utils/assignmentSeries';
import { startOfISOWeek, addWeeks, format, getISOWeek, getISOWeekYear } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeeklyAssignmentsProps {
  assignments: Assignment[];
  selectedWeek: number;
  selectedYear?: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

type DayKey = 'all' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
const DAY_KEYS: DayKey[] = ['all', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_INDEX_MAP: Record<Exclude<DayKey, 'all'>, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
};

const WeeklyAssignments: React.FC<WeeklyAssignmentsProps> = ({
  assignments,
  selectedWeek,
  selectedYear,
  onPreviousWeek,
  onNextWeek,
}) => {
  const { t, currentLanguage } = useTranslation();
  const { cars } = useCars();
  const { employees } = useEmployees();
  const { vacations } = useVacations();
  const { isAdmin } = usePermissions();
  const {
    createAssignment,
    updateAssignment,
    deleteAssignment,
  } = useOptimizedAssignments('all');

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [dayFilter, setDayFilter] = useState<DayKey>('all');

  // Form/edit state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<Partial<Assignment>>({});
  const [pendingDelete, setPendingDelete] = useState<Assignment | null>(null);

  // Compute the prefill date for "Create": today if current week, else Monday of selected week
  const prefillDate = useMemo(() => {
    const today = new Date();
    const year = selectedYear ?? getISOWeekYear(today);
    if (selectedWeek === getISOWeek(today) && year === getISOWeekYear(today)) {
      return format(today, 'yyyy-MM-dd');
    }
    const jan4 = new Date(year, 0, 4);
    const monday = startOfISOWeek(addWeeks(jan4, selectedWeek - 1));
    return format(monday, 'yyyy-MM-dd');
  }, [selectedWeek, selectedYear]);

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsAssignmentDialogOpen(true);
  };

  const openCreate = useCallback(() => {
    setCurrentEdit(null);
    setFormData({
      title: '',
      description: '',
      date: prefillDate,
      fromTime: '08:00',
      toTime: '16:00',
      location: '',
      car: '',
      employees: [],
      published: false,
    });
    setFormDialogOpen(true);
  }, [prefillDate]);

  const openEdit = useCallback((assignment: Assignment) => {
    setCurrentEdit(assignment);
    setFormData({
      ...assignment,
      employees: assignment.employees ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : '',
    });
    setFormDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (data: Partial<Assignment>) => {
      try {
        if (currentEdit?.id) {
          await updateAssignment(currentEdit.id, data);
        } else {
          await createAssignment(data);
        }
        setFormDialogOpen(false);
        setCurrentEdit(null);
      } catch (e) {
        if (import.meta.env.DEV) console.error('[WeeklyAssignments] submit failed', e);
      }
    },
    [currentEdit, createAssignment, updateAssignment]
  );

  const handleEmployeeToggle = useCallback((employeeId: string) => {
    setFormData((prev) => {
      const current = prev.employees || [];
      const next = current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId];
      return { ...prev, employees: next };
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    await deleteAssignment(pendingDelete.id);
    setPendingDelete(null);
  }, [pendingDelete, deleteAssignment]);

  // Function to get car names from assignment
  const getCarNames = (assignment: Assignment): string[] => {
    const carNames: string[] = [];
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      assignment.cars.forEach((carId) => {
        const car = cars.find((c) => c.id === carId);
        if (car) carNames.push(car.name);
      });
    } else if (assignment.car) {
      if (typeof assignment.car === 'string') {
        const car = cars.find((c) => c.id === assignment.car);
        if (car) carNames.push(car.name);
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        carNames.push(assignment.car.name);
      }
    }
    return carNames;
  };

  const getEmployeeNames = (assignment: Assignment): string[] => {
    const names: string[] = [];
    if (assignment.assignedEmployees && assignment.assignedEmployees.length > 0) {
      names.push(...assignment.assignedEmployees.map((emp) => emp.name || emp.email || ''));
    }
    if (assignment.employees && assignment.employees.length > 0) {
      names.push(...assignment.employees);
    }
    return filterDisplayNames(names);
  };

  // Day-of-week counts (within already week-filtered assignments)
  const dayCounts = useMemo(() => {
    const counts: Record<DayKey, number> = {
      all: assignments.length, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
    };
    assignments.forEach((a) => {
      const dow = new Date(a.date).getDay();
      const key = (Object.keys(DAY_INDEX_MAP) as Array<Exclude<DayKey, 'all'>>).find(
        (k) => DAY_INDEX_MAP[k] === dow
      );
      if (key) counts[key]++;
    });
    return counts;
  }, [assignments]);

  const filteredByDay = useMemo(() => {
    if (dayFilter === 'all') return assignments;
    const targetDow = DAY_INDEX_MAP[dayFilter];
    return assignments.filter((a) => new Date(a.date).getDay() === targetDow);
  }, [assignments, dayFilter]);

  const sortedAssignments = useMemo(() => {
    return [...filteredByDay].sort((a, b) => {
      const today = new Date().toISOString().split('T')[0];
      const aIsToday = a.date === today;
      const bIsToday = b.date === today;
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.fromTime.localeCompare(b.fromTime);
    });
  }, [filteredByDay]);

  return (
    <>
      <Card className="brand-card-accent">
        <CardHeader className="pb-3 brand-card-header">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/12 text-primary">
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate brand-dot">
                  {t('dashboard.myAssignments')}
                </CardTitle>
              </div>
              <div className="flex-shrink-0">
                <WeekNavigation
                  onPrevious={onPreviousWeek}
                  onNext={onNextWeek}
                  currentWeek={selectedWeek}
                />
              </div>
            </div>

            {/* Day-of-week filter */}
            <div className="flex flex-wrap gap-1.5">
              {DAY_KEYS.map((k) => {
                const active = dayFilter === k;
                const count = dayCounts[k];
                const disabled = k !== 'all' && count === 0;
                return (
                  <button
                    key={k}
                    onClick={() => !disabled && setDayFilter(k)}
                    disabled={disabled}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium transition-colors border',
                      active
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25'
                        : disabled
                        ? 'bg-muted/50 text-muted-foreground/50 border-transparent cursor-not-allowed'
                        : 'bg-background text-foreground border-border hover:bg-primary/8 hover:border-primary/30 hover:text-primary'
                    )}
                  >
                    <span>{t(`dashboard.dayFilter.${k}`)}</span>
                    <span className={cn(
                      'tabular-nums text-[10px] px-1 rounded',
                      active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              {isAdmin && (
                <Button variant="brand" size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  <span>{t('planner.createAssignment')}</span>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link to="/planner" className="flex items-center justify-center gap-2">
                  <span>{t('dashboard.viewAll')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedAssignments.length === 0 ? (
            <div className="text-center py-10">
              <div className="p-3 rounded-full bg-primary/8 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary/70" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                {t('dashboard.noAssignments')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.noAssignmentsScheduled')}
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {sortedAssignments.map((assignment) => {
                const employeeNames = getEmployeeNames(assignment);
                const carNames = getCarNames(assignment);

                return (
                  <div
                    key={assignment.id}
                    className="border border-border rounded-lg p-3 bg-card hover:bg-primary/4 hover:border-primary/30 transition-colors group relative"
                  >
                    <div
                      onClick={() => handleAssignmentClick(assignment)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2 pr-6">
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-semibold text-sm text-foreground text-left truncate">
                            {assignment.title || 'Untitled'}
                          </h3>
                          {assignment.location && (
                            <p className="text-xs text-muted-foreground text-left truncate">
                              {assignment.location}
                            </p>
                          )}
                        </div>
                        <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium tabular-nums">
                          {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                        </div>
                      </div>

                      {assignment.description && (
                        <p className="mb-2 text-left text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {assignment.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {carNames.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-foreground">
                            <Car className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                            <span className="truncate">{carNames.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-foreground">
                          <Clock className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          <span className="tabular-nums">
                            {assignment.fromTime.substring(0, 5)} – {assignment.toTime.substring(0, 5)}
                          </span>
                        </div>
                        {employeeNames.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-foreground">
                            <Users className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                            <span className="truncate">{employeeNames.join(', ')}</span>
                          </div>
                        )}
                        {assignment.responsibleUser && (
                          <div className="flex items-center gap-2 text-xs text-foreground">
                            <UserCheck className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                            <span className="truncate">
                              {typeof assignment.responsibleUser === 'string' ? assignment.responsibleUser : assignment.responsibleUser.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-7 w-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => openEdit(assignment)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              {t('planner.editAssignment')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingDelete(assignment)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('planner.deleteAssignment')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignmentDetailsDialog
        assignment={selectedAssignment}
        isOpen={isAssignmentDialogOpen}
        onClose={() => setIsAssignmentDialogOpen(false)}
        cars={cars}
        siblingAssignmentIds={getSeriesSiblingIds(selectedAssignment, assignments)}
      />

      {/* Create / Edit dialog */}
      {formDialogOpen && (
        <AssignmentDialogManager
          isDialogOpen={formDialogOpen}
          setIsDialogOpen={setFormDialogOpen}
          currentAssignment={currentEdit}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onDelete={() => {}}
          onPublish={() => {}}
          assignments={assignments}
          cars={cars}
          employees={employees}
          vacations={vacations}
          selectedDay={(formData.date as string) || prefillDate}
          onPublishDay={() => {}}
          onEmployeeToggle={handleEmployeeToggle}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.title} – {t('common.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WeeklyAssignments;
