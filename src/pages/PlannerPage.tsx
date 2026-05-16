import React, { useCallback, useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '../context/TranslationContext';
import { useOptimizedAssignments } from '../hooks/useOptimizedAssignments';
import { Assignment } from '../types/assignment';
import { useEmployees } from '../hooks/useEmployees';
import { useCars } from '../hooks/car';
import { useVacations } from '../hooks/useVacations';
import { useAuth } from '../context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import PlannerContent from '../components/Planner/PlannerContent';
const PlannerDialogContainer = lazy(() => import('../components/Planner/PlannerDialogContainer'));
const SeriesActionDialog = lazy(() => import('../components/Planner/SeriesActionDialog'));
import { Clock, ChevronLeft, ChevronRight, Plus, Monitor, LayoutGrid, LayoutList, List, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { getISOWeek, getISOWeekYear, addWeeks, format } from 'date-fns';
import { getWeekDates, getAllWeekDays } from '@/utils/dates';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import PlannerSearchFilter from '@/components/Planner/PlannerSearchFilter';
import FilterChips, { applyPlannerFilters, useActivePlannerFilters } from '@/components/Planner/FilterChips';
import { useAssignmentConflicts } from '@/hooks/useAssignmentConflicts';
import { useToast } from '@/hooks/use-toast';
import { setPlannerWeek } from '@/stores/plannerWeekStore';
import BulkActionBar from '@/components/Planner/BulkActionBar';
import BulkAssignEmployeeDialog from '@/components/Planner/BulkAssignEmployeeDialog';
import BulkAssignCarDialog from '@/components/Planner/BulkAssignCarDialog';
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

const PlannerPage: React.FC = () => {
  const {
    t,
    currentLanguage
  } = useTranslation();
  const {
    canCreate,
    canPublishTasks
  } = usePermissions();
  const {
    user
  } = useAuth();
  const {
    employees
  } = useEmployees();
  const {
    cars
  } = useCars();
  const {
    vacations
  } = useVacations();
  
  // Use optimized assignments hook for unified data management
  const {
    assignments,
    loading,
    error,
    operationStates,
    refetch,
    createAssignment,
    updateAssignment,
    updateSeriesAssignments,
    deleteAssignment,
    deleteAssignmentsByGroupId,
    detachFromGroup,
    publishAssignment,
    publishAssignmentsByDate,
    publishAssignmentsByIds
  } = useOptimizedAssignments('all');

  // Simplified planner state management using ISO week numbers with localStorage persistence
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const saved = localStorage.getItem('plannerSelectedWeek');
    return saved ? parseInt(saved, 10) : getISOWeek(new Date());
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('plannerSelectedYear');
    return saved ? parseInt(saved, 10) : getISOWeekYear(new Date());
  });
  
  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<'standard' | 'compact' | 'grid'>(() => {
    const saved = localStorage.getItem('plannerViewMode');
    return (saved === 'compact' || saved === 'standard' || saved === 'grid') ? saved : 'standard';
  });
  
  // Search filter state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expanded days state - only today is expanded by default
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return { [today]: true };
  });
  
  // Track if all days are expanded
  const [allExpanded, setAllExpanded] = useState(false);
  
  // Handler to toggle day section expansion
  const handleToggleExpansion = useCallback((date: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !(prev[date] ?? false)
    }));
  }, []);
  
  // Memoized week dates — getWeekDates is module-level cached, so the same
  // (week, year) returns the same object reference across renders.
  const weekDates = useMemo(
    () => getWeekDates(selectedWeek, selectedYear),
    [selectedWeek, selectedYear]
  );

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('plannerViewMode', viewMode);
  }, [viewMode]);

  // Persist selected week and year
  useEffect(() => {
    localStorage.setItem('plannerSelectedWeek', selectedWeek.toString());
    localStorage.setItem('plannerSelectedYear', selectedYear.toString());
    setPlannerWeek(selectedWeek, selectedYear);
  }, [selectedWeek, selectedYear]);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Clear selection when navigating to a different week
  useEffect(() => {
    clearSelection();
  }, [selectedWeek, selectedYear, clearSelection]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [seriesAction, setSeriesAction] = useState<{ assignment: Assignment; mode: 'edit' | 'delete' } | null>(null);
  const [editMode, setEditMode] = useState<'single' | 'series' | null>(null);
  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    fromTime: '08:00',
    toTime: '16:00',
    location: '',
    car: '',
    employees: []
  });

  // Handler to expand/collapse all days
  const handleToggleAllExpanded = useCallback(() => {
    const newExpanded = !allExpanded;
    setAllExpanded(newExpanded);
    if (weekDates) {
      const newExpandedDays: Record<string, boolean> = {};
      getAllWeekDays(weekDates).forEach(dateStr => {
        newExpandedDays[dateStr] = newExpanded;
      });
      setExpandedDays(newExpandedDays);
    }
  }, [allExpanded, weekDates]);

  // Filter assignments by week using cheap YYYY-MM-DD lexicographic compare.
  // Avoids per-row Date allocation + getISOWeek/getISOWeekYear computation.
  const weekAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];
    const { startStr, endStr } = weekDates;
    return assignments.filter(assignment => {
      const d = assignment.date;
      return typeof d === 'string' && d >= startStr && d <= endStr;
    });
  }, [assignments, weekDates]);

  // Filter assignments by search query
  const filteredWeekAssignments = useMemo(() => {
    if (!searchQuery.trim()) return weekAssignments;
    
    const query = searchQuery.toLowerCase().trim();
    
    return weekAssignments.filter(assignment => {
      // Search in case number
      if (assignment.case_number?.toLowerCase().includes(query)) return true;
      
      // Search in title
      if (assignment.title?.toLowerCase().includes(query)) return true;
      
      // Search in location
      if (assignment.location?.toLowerCase().includes(query)) return true;
      
      // Search in employee names
      if (assignment.assignedEmployees?.some(emp => 
        (typeof emp === 'object' ? emp.name : emp)?.toLowerCase().includes(query)
      )) return true;
      
      return false;
    });
  }, [weekAssignments, searchQuery]);

  // Handlers — reuse memoized weekDates
  const handlePreviousWeek = useCallback(() => {
    const prevWeekStart = addWeeks(weekDates.start, -1);
    setSelectedWeek(getISOWeek(prevWeekStart));
    setSelectedYear(getISOWeekYear(prevWeekStart));
  }, [weekDates]);

  const handleNextWeek = useCallback(() => {
    const nextWeekStart = addWeeks(weekDates.start, 1);
    setSelectedWeek(getISOWeek(nextWeekStart));
    setSelectedYear(getISOWeekYear(nextWeekStart));
  }, [weekDates]);

  const handleOpenCreateDialog = (date: string) => {
    setCurrentAssignment(null);
    setSelectedDay(date);
    setFormData({
      title: '',
      description: '',
      date,
      fromTime: '08:00',
      toTime: '16:00',
      location: '',
      car: '',
      employees: [],
      published: false
    });
    setIsDialogOpen(true);
  };

  const openEditDialogDirect = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setSelectedDay(assignment.date);
    setFormData({
      ...assignment,
      employees: assignment.employees ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : '',
      published: assignment.published
    });
    setIsDialogOpen(true);
  };

  // Detect if assignment is part of a series — either via groupId, or via legacy fallback
  // (same case_number/title + same department + multiple dates)
  const findSeriesSiblings = useCallback((assignment: Assignment): Assignment[] => {
    if (assignment.groupId) {
      return assignments.filter(a => a.groupId === assignment.groupId);
    }
    // Legacy fallback: match on case_number first, then on title
    const key = (assignment.case_number && assignment.case_number.trim()) || assignment.title?.trim();
    if (!key) return [assignment];
    return assignments.filter(a => {
      const aKey = (a.case_number && a.case_number.trim()) || a.title?.trim();
      return aKey === key;
    });
  }, [assignments]);

  const handleOpenEditDialog = (assignment: Assignment) => {
    const siblings = findSeriesSiblings(assignment);
    // INTENTIONAL: only prompt SeriesActionDialog when siblings.length > 1.
    // A lone assignment (incl. orphaned groupId after sibling deletion) edits directly.
    if (siblings.length > 1) {
      setSeriesAction({ assignment, mode: 'edit' });
    } else {
      openEditDialogDirect(assignment);
    }
  };

  const handleSubmit = async (data: Partial<Assignment>) => {
    if (import.meta.env.DEV) console.log('[PlannerPage] Form submission started with data:', data);
    try {
      if (currentAssignment?.id) {
        if (import.meta.env.DEV) console.log('[PlannerPage] Updating existing assignment:', currentAssignment.id);
        await updateAssignment(currentAssignment.id, data);
        if (import.meta.env.DEV) console.log('[PlannerPage] Assignment updated successfully');
        setCurrentAssignment(null);
        setFormData({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          fromTime: '08:00',
          toTime: '16:00',
          location: '',
          car: '',
          employees: [],
          published: false
        });
        setIsDialogOpen(false);
      } else {
        if (import.meta.env.DEV) console.log('[PlannerPage] Creating new assignment');
        await createAssignment(data);
        if (import.meta.env.DEV) console.log('[PlannerPage] Assignment created successfully');
        setFormData({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          fromTime: '08:00',
          toTime: '16:00',
          location: '',
          car: '',
          employees: [],
          published: false
        });
        setIsDialogOpen(false);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[PlannerPage] Operation failed:', error);
    }
  };

  const handleCopyAssignment = (assignment: Assignment) => {
    setCurrentAssignment(null);
    const today = new Date().toISOString().split('T')[0];
    setSelectedDay(today);
    setFormData({
      ...assignment,
      id: undefined,
      groupId: undefined,
      date: today,
      published: false,
      employees: assignment.employees ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : ''
    });
    setIsDialogOpen(true);
  };

  const { toast } = useToast();

  // Step 5 (E): Copy all of yesterday's assignments to the given date as drafts.
  // Skips assignments where any assigned employee has approved vacation that overlaps the new date.
  const handleCopyDayFromYesterday = useCallback(async (date: string) => {
    const target = new Date(date + 'T00:00:00');
    const prev = new Date(target);
    prev.setDate(prev.getDate() - 1);
    const yesterdayKey = prev.toISOString().slice(0, 10);
    const sourceAssignments = assignments.filter(a => a.date === yesterdayKey);

    if (sourceAssignments.length === 0) {
      toast({
        title: currentLanguage === 'da' ? 'Ingen opgaver i går' : 'No tasks yesterday',
        description: currentLanguage === 'da'
          ? 'Der er ingen opgaver fra forrige dag at kopiere.'
          : 'There are no tasks from the previous day to copy.',
      });
      return;
    }

    // Pre-compute employees on approved vacation for the target date
    const absentEmployeeIds = new Set<string>(
      (vacations || [])
        .filter(v => v.status === 'approved' && date >= v.start_date && date <= v.end_date)
        .map(v => v.user_id)
    );

    let copied = 0;
    let skippedEmployees = 0;
    for (const src of sourceAssignments) {
      const employees = (src.employees || []).filter(eid => {
        if (absentEmployeeIds.has(eid)) {
          skippedEmployees++;
          return false;
        }
        return true;
      });

      try {
        await createAssignment({
          title: src.title,
          description: src.description,
          date,
          fromTime: src.fromTime,
          toTime: src.toTime,
          location: src.location,
          type: src.type,
          case_number: src.case_number,
          responsibleUserId: src.responsibleUserId,
          car: typeof src.car === 'string' ? src.car : src.car?.id,
          employees,
          published: false,
        } as Partial<Assignment>);
        copied++;
      } catch (err) {
        if (import.meta.env.DEV) console.error('[CopyDay] failed for', src.id, err);
      }
    }

    toast({
      title: currentLanguage === 'da'
        ? `${copied} opgave${copied === 1 ? '' : 'r'} kopieret som kladde`
        : `${copied} task${copied === 1 ? '' : 's'} copied as draft`,
      description: skippedEmployees > 0
        ? (currentLanguage === 'da'
            ? `${skippedEmployees} medarbejder-tildeling${skippedEmployees === 1 ? '' : 'er'} blev udeladt pga. fravær.`
            : `${skippedEmployees} employee assignment${skippedEmployees === 1 ? '' : 's'} were skipped due to absence.`)
        : undefined,
    });
  }, [assignments, vacations, createAssignment, toast, currentLanguage]);

  const sortedWeekAssignments = useMemo(() => {
    if (!filteredWeekAssignments) return [];
    return [...filteredWeekAssignments].sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.fromTime.localeCompare(b.fromTime);
    });
  }, [filteredWeekAssignments]);

  // Apply chip-based filters (URL-driven) on top of search-filtered list
  const activeChipFilters = useActivePlannerFilters();
  const { hasConflicts: weekHasConflicts } = useAssignmentConflicts(weekAssignments);
  const chipFilteredAssignments = useMemo(
    () => applyPlannerFilters(sortedWeekAssignments, activeChipFilters, user?.id, weekHasConflicts),
    [sortedWeekAssignments, activeChipFilters, user?.id, weekHasConflicts]
  );

  // Define handlers that use the optimized hooks
  const handlePublishDay = useCallback(async (date: string) => {
    await publishAssignmentsByDate(date);
  }, [publishAssignmentsByDate]);

  // ---- Bulk actions ----
  const handleBulkPublish = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      await publishAssignmentsByIds([...selectedIds]);
      clearSelection();
    } finally {
      setBulkBusy(false);
    }
  }, [selectedIds, publishAssignmentsByIds, clearSelection]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    const ids = [...selectedIds];
    let failed = 0;
    try {
      await Promise.all(ids.map(id => deleteAssignment(id).catch(() => { failed++; })));
      toast({
        title: failed === 0 ? `${ids.length} opgaver slettet` : `${ids.length - failed} slettet, ${failed} fejlede`,
        variant: failed === 0 ? 'default' : 'destructive',
      });
      clearSelection();
    } finally {
      setBulkBusy(false);
      setBulkDeleteOpen(false);
    }
  }, [selectedIds, deleteAssignment, toast, clearSelection]);

  const handleBulkAssignEmployee = useCallback(async (userId: string) => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = [...selectedIds];
      const rows = ids.map(assignment_id => ({ assignment_id, user_id: userId }));
      const { error } = await supabase
        .from('assignments_employees')
        .upsert(rows, { onConflict: 'assignment_id,user_id', ignoreDuplicates: true });
      if (error) {
        toast({ title: 'Kunne ikke tildele medarbejder', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: `Medarbejder tildelt ${ids.length} opgave${ids.length === 1 ? '' : 'r'}` });
        await refetch();
        clearSelection();
      }
    } finally {
      setBulkBusy(false);
    }
  }, [selectedIds, toast, refetch, clearSelection]);

  const handleDeleteAssignment = useCallback(async (id: string) => {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;
    const siblings = findSeriesSiblings(assignment);
    // INTENTIONAL: only prompt SeriesActionDialog when siblings.length > 1.
    // A lone assignment deletes directly without the series prompt.
    if (siblings.length > 1) {
      setSeriesAction({ assignment, mode: 'delete' });
    } else {
      await deleteAssignment(id);
    }
  }, [deleteAssignment, assignments, findSeriesSiblings]);

  // Backfill group_id for legacy series (where group_id is NULL but case_number/title matches)
  const ensureGroupId = useCallback(async (assignment: Assignment): Promise<string | null> => {
    if (assignment.groupId) return assignment.groupId;
    const siblings = findSeriesSiblings(assignment);
    if (siblings.length <= 1) return null;
    const newGroupId = crypto.randomUUID();
    const ids = siblings.map(s => s.id);
    const { error } = await supabase
      .from('assignments')
      .update({ group_id: newGroupId, updated_at: new Date().toISOString() })
      .in('id', ids);
    if (error) {
      if (import.meta.env.DEV) console.error('[PlannerPage] Failed to backfill group_id:', error);
      return null;
    }
    await refetch();
    return newGroupId;
  }, [findSeriesSiblings, refetch]);

  // Series action handlers
  const handleSeriesSingleDay = useCallback(async () => {
    if (!seriesAction) return;
    const { assignment, mode } = seriesAction;
    setSeriesAction(null);

    if (mode === 'delete') {
      await deleteAssignment(assignment.id);
    } else {
      // Detach from group then open edit dialog as single
      if (assignment.groupId) {
        await detachFromGroup(assignment.id);
      }
      setEditMode('single');
      openEditDialogDirect({ ...assignment, groupId: undefined });
    }
  }, [seriesAction, deleteAssignment, detachFromGroup]);

  const handleSeriesEntireSeries = useCallback(async () => {
    if (!seriesAction) return;
    const { assignment, mode } = seriesAction;
    setSeriesAction(null);

    // Backfill group_id for legacy data so series operations work
    const groupId = await ensureGroupId(assignment);

    if (mode === 'delete') {
      if (groupId) {
        await deleteAssignmentsByGroupId(groupId);
      } else {
        await deleteAssignment(assignment.id);
      }
    } else {
      // Open edit dialog for the clicked assignment in series mode
      setEditMode('series');
      openEditDialogDirect({ ...assignment, groupId: groupId || assignment.groupId });
    }
  }, [seriesAction, deleteAssignmentsByGroupId, deleteAssignment, ensureGroupId]);

  const handlePublishAssignment = useCallback(async (id: string) => {
    await publishAssignment(id);
  }, [publishAssignment]);

  const handleEmployeeToggle = useCallback((employeeId: string) => {
    if (import.meta.env.DEV) console.log('[PlannerPage] Employee toggled:', employeeId);
    
    if (!employeeId || employeeId.trim() === '') {
      if (import.meta.env.DEV) console.warn('[PlannerPage] Invalid employee ID provided');
      return;
    }

    setFormData(prev => {
      const currentEmployees = prev.employees || [];
      if (import.meta.env.DEV) console.log('[PlannerPage] Current employees before toggle:', currentEmployees);
      
      let newEmployees;
      
      if (currentEmployees.includes(employeeId)) {
        newEmployees = currentEmployees.filter(id => id !== employeeId);
        if (import.meta.env.DEV) console.log('[PlannerPage] Removing employee:', employeeId);
      } else {
        newEmployees = [...currentEmployees, employeeId];
        if (import.meta.env.DEV) console.log('[PlannerPage] Adding employee:', employeeId);
      }
      
      if (import.meta.env.DEV) console.log('[PlannerPage] New employees array:', newEmployees);
      
      return {
        ...prev,
        employees: newEmployees
      };
    });
  }, []);

  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();

  const handleShowOnScreen = () => {
    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({
      date: today,
      t: String(Date.now()),
      source: 'button',
    });
    if (selectedDepartmentId) params.set('departmentId', selectedDepartmentId);
    if (selectedSubDepartmentId) params.set('subDepartmentId', selectedSubDepartmentId);
    const screenUrl = `/screen-display?${params.toString()}`;
    window.open(screenUrl, '_blank', 'fullscreen=yes');
  };

  // Convert operationStates format to match PlannerContent expectations
  const convertedOperationStates: Record<string, 'publishing' | 'deleting' | 'updating' | null> = useMemo(() => {
    const converted: Record<string, 'publishing' | 'deleting' | 'updating' | null> = {};
    Object.entries(operationStates).forEach(([key, value]) => {
      if (value === 'loading') {
        converted[key] = 'updating';
      } else {
        converted[key] = null;
      }
    });
    return converted;
  }, [operationStates]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-muted-foreground">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">{t('common.error')}</h2>
          <p className="text-muted-foreground">{typeof error === 'string' ? error : 'An error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <DataFetchErrorBoundary>
    <div className="min-h-screen w-full bg-background">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-5 space-y-3 sm:space-y-4">
        {/* Clean Header — Apple/Arc style */}
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
            <div className="flex items-center justify-center gap-1 rounded-lg border border-border bg-card px-1 py-1">
              <Button variant="ghost" size="sm" onClick={handlePreviousWeek} className="h-7 w-7 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[80px] text-center text-sm text-foreground">
                {t('planner.week')} {selectedWeek}
              </span>
              <Button variant="ghost" size="sm" onClick={handleNextWeek} className="h-7 w-7 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {canPublishTasks && (
                <Button onClick={handleShowOnScreen} variant="outline" size="sm">
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('planner.showOnScreen')}</span>
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

        {/* Search, filter chips and view toggle — single combined row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
            <PlannerSearchFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <div className="min-w-0 flex-1">
              <FilterChips weekAssignments={weekAssignments} />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {currentLanguage === 'da' ? 'Visning:' : 'View:'}
            </span>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as 'standard' | 'compact' | 'grid')}
              className="bg-muted/50 border border-border rounded-lg p-0.5"
            >
              <ToggleGroupItem value="standard" size="sm" className="h-7 px-2.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                <List className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">{t('planner.viewModeStandard')}</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" size="sm" className="h-7 px-2.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">{currentLanguage === 'da' ? 'Gitter' : 'Grid'}</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="compact" size="sm" className="h-7 px-2.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">
                <LayoutList className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">{t('planner.viewModeCompact')}</span>
              </ToggleGroupItem>
            </ToggleGroup>

            {(viewMode === 'standard' || viewMode === 'grid') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleAllExpanded}
                className="h-7 px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
              >
                <ChevronsUpDown className="h-3.5 w-3.5 mr-1.5" />
                {allExpanded
                  ? (currentLanguage === 'da' ? 'Fold sammen' : 'Collapse all')
                  : (currentLanguage === 'da' ? 'Udvid alle' : 'Expand all')
                }
              </Button>
            )}
          </div>
        </div>

        {/* Search results indicator */}
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            {chipFilteredAssignments.length === 0 ? (
              <span>{t('planner.noSearchResults')}</span>
            ) : (
              <span>
                {currentLanguage === 'da' 
                  ? `${chipFilteredAssignments.length} ${chipFilteredAssignments.length === 1 ? 'opgave' : 'opgaver'} fundet`
                  : `${chipFilteredAssignments.length} ${chipFilteredAssignments.length === 1 ? 'assignment' : 'assignments'} found`
                }
              </span>
            )}
          </div>
        )}

        {/* Main Content */}
        <PlannerContent 
          weekAssignments={chipFilteredAssignments} 
          operationStates={convertedOperationStates}
          expandedDays={expandedDays}
          onToggleExpansion={handleToggleExpansion}
          onEditAssignment={handleOpenEditDialog} 
          onDeleteAssignment={handleDeleteAssignment} 
          onPublishAssignment={handlePublishAssignment} 
          onPublishDay={handlePublishDay} 
          onCreateAssignment={handleOpenCreateDialog} 
          onCopyAssignment={handleCopyAssignment} 
          onCopyDayFromYesterday={handleCopyDayFromYesterday}
          selectedWeek={selectedWeek} 
          selectedYear={selectedYear} 
          weekDates={weekDates}
          viewMode={viewMode}
          selectedIds={selectedIds}
          selectionActive={selectedIds.size > 0}
          onToggleSelect={handleToggleSelect}
        />

        {/* Assignment Dialog */}
        {isDialogOpen && (
          <Suspense fallback={null}>
            <PlannerDialogContainer 
              isDialogOpen={isDialogOpen} 
              onClose={() => { setIsDialogOpen(false); setEditMode(null); }} 
              onSubmit={handleSubmit} 
              onSubmitSeries={updateSeriesAssignments}
              onDetachFromGroup={detachFromGroup}
              editMode={editMode}
              currentAssignment={currentAssignment} 
              selectedDay={selectedDay} 
              formData={formData} 
              setFormData={setFormData} 
              employees={employees} 
              cars={cars} 
              vacations={vacations} 
              assignments={assignments} 
              onEmployeeToggle={handleEmployeeToggle} 
            />
          </Suspense>
        )}

        {/* Series Action Dialog */}
        {seriesAction && (
          <Suspense fallback={null}>
            <SeriesActionDialog
              open={!!seriesAction}
              onOpenChange={(open) => { if (!open) setSeriesAction(null); }}
              mode={seriesAction?.mode || 'edit'}
              onSingleDay={handleSeriesSingleDay}
              onEntireSeries={handleSeriesEntireSeries}
            />
          </Suspense>
        )}

        {/* Bulk action bar */}
        <BulkActionBar
          count={selectedIds.size}
          busy={bulkBusy}
          onAssignEmployee={() => setBulkAssignOpen(true)}
          onAssignCar={() => setBulkAssignCarOpen(true)}
          onDelete={() => setBulkDeleteOpen(true)}
          onClear={clearSelection}
        />

        <BulkAssignEmployeeDialog
          open={bulkAssignOpen}
          count={selectedIds.size}
          onClose={() => setBulkAssignOpen(false)}
          onConfirm={handleBulkAssignEmployee}
        />

        <BulkAssignCarDialog
          open={bulkAssignCarOpen}
          count={selectedIds.size}
          onClose={() => setBulkAssignCarOpen(false)}
          onConfirm={handleBulkAssignCar}
        />

        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slet {selectedIds.size} opgave{selectedIds.size === 1 ? '' : 'r'}?</AlertDialogTitle>
              <AlertDialogDescription>
                Denne handling kan ikke fortrydes. Alle valgte opgaver slettes permanent.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkBusy}>Annullér</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDeleteConfirm} disabled={bulkBusy}>
                Slet
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
    </DataFetchErrorBoundary>
  );
};

export default PlannerPage;
