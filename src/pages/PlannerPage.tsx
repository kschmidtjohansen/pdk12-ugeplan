import React, { useCallback, useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '../context/TranslationContext';
import { useOptimizedAssignments } from '../hooks/useOptimizedAssignments';
import { useQueryClient } from '@tanstack/react-query';
import { useEmployeeData } from '@/hooks/employee/useEmployeeData';
import { Assignment } from '../types/assignment';
import { useEmployees } from '../hooks/useEmployees';
import { useCars } from '../hooks/car';
import { useVacations } from '../hooks/useVacations';
import { useAuth } from '../context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import PlannerContent from '../components/Planner/PlannerContent';
import PlannerHeader from '@/components/Planner/page/PlannerHeader';
import PlannerBulkActions from '@/components/Planner/page/PlannerBulkActions';
import { useAdjacentWeekPrefetch } from '@/hooks/planner/useAdjacentWeekPrefetch';
import { useCopyDayFromYesterday } from '@/hooks/planner/useCopyDayFromYesterday';
const PlannerDialogContainer = lazy(() => import('../components/Planner/PlannerDialogContainer'));
const SeriesActionDialog = lazy(() => import('../components/Planner/SeriesActionDialog'));
import { usePermissions } from '@/context/AuthContext';
import ListSkeleton from '@/components/shared/ListSkeleton';
import { getISOWeek, getISOWeekYear, addWeeks, format } from 'date-fns';
import { getWeekDates, getAllWeekDays } from '@/utils/dates';
import SubDepartmentQuickSwitcher from '@/components/shared/SubDepartmentQuickSwitcher';
import PlannerFilterBar from '@/components/Planner/PlannerFilterBar';
import { PlannerActionsProvider } from '@/context/PlannerActionsContext';
import { toast as sonnerToast } from 'sonner';

import { useToast } from '@/hooks/use-toast';
import { setPlannerWeek } from '@/stores/plannerWeekStore';
const BulkAssignEmployeeDialog = lazy(() => import('@/components/Planner/BulkAssignEmployeeDialog'));
const BulkAssignCarDialog = lazy(() => import('@/components/Planner/BulkAssignCarDialog'));



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
    employees,
    loading: employeesLoading
  } = useEmployees();
  const {
    cars
  } = useCars();
  const {
    vacations
  } = useVacations();
  const { employees: allEmployees } = useEmployeeData();
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();
  const queryClient = useQueryClient();

  // Planner filters: employee multi-select + postcode proximity lookup
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [filterPostcode, setFilterPostcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  
  
  
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
  const [viewMode, setViewMode] = useState<'standard' | 'compact' | 'grid' | 'calendar'>(() => {
    const saved = localStorage.getItem('plannerViewMode');
    return (saved === 'compact' || saved === 'standard' || saved === 'grid' || saved === 'calendar') ? saved : 'standard';
  });
  
  
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

  const { handlePrefetchAssignments, handleCancelPrefetch } = useAdjacentWeekPrefetch();

  const handleOpenCreateDialog = useCallback((date: string) => {
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
      published: false,
      subDepartmentId: selectedSubDepartmentId || null
    });
    setIsDialogOpen(true);
  }, [selectedSubDepartmentId]);

  const openEditDialogDirect = useCallback((assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setSelectedDay(assignment.date);
    setFormData({
      ...assignment,
      employees: assignment.employees ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : '',
      published: assignment.published
    });
    setIsDialogOpen(true);
  }, []);

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

  const handleOpenEditDialog = useCallback((assignment: Assignment) => {
    const siblings = findSeriesSiblings(assignment);
    // INTENTIONAL: only prompt SeriesActionDialog when siblings.length > 1.
    // A lone assignment (incl. orphaned groupId after sibling deletion) edits directly.
    if (siblings.length > 1) {
      setSeriesAction({ assignment, mode: 'edit' });
    } else {
      openEditDialogDirect(assignment);
    }
  }, [findSeriesSiblings, openEditDialogDirect]);

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

  const handleCopyAssignment = useCallback((assignment: Assignment) => {
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
  }, []);

  const { toast } = useToast();

  const handleCopyDayFromYesterday = useCopyDayFromYesterday(assignments, vacations, createAssignment);

  // Quick search index: employee id -> lowercase name (built once per employee list)
  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();
    (employees || []).forEach(e => map.set(e.id, (e.name || '').toLowerCase()));
    return map;
  }, [employees]);

  const sortedWeekAssignments = useMemo(() => {
    if (!weekAssignments) return [];
    // Employee filter: only keep assignments where at least one selected employee is assigned
    let base = selectedEmployeeIds.length > 0
      ? weekAssignments.filter(a => (a.employees || []).some(id => selectedEmployeeIds.includes(id)))
      : weekAssignments;

    // Quick search across case number, title, address, city, description and employee names
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      base = base.filter(a => {
        if ((a.case_number || '').toLowerCase().includes(q)) return true;
        if ((a.title || '').toLowerCase().includes(q)) return true;
        if ((a.location || '').toLowerCase().includes(q)) return true;
        if ((a.city || '').toLowerCase().includes(q)) return true;
        if ((a.zip_code || '').toLowerCase().includes(q)) return true;
        if ((a.description || '').toLowerCase().includes(q)) return true;
        return (a.employees || []).some(id => (employeeNameById.get(id) || '').includes(q));
      });
    }

    return [...base].sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.fromTime.localeCompare(b.fromTime);
    });
  }, [weekAssignments, selectedEmployeeIds, searchQuery, employeeNameById]);


  // Define handlers that use the optimized hooks
  const handlePublishDay = useCallback(async (date: string) => {
    await publishAssignmentsByDate(date);
  }, [publishAssignmentsByDate]);

  // Quick move: shift a single assignment N days with an undo toast
  const handleQuickMove = useCallback(async (assignment: Assignment, days: number) => {
    const base = assignment.date?.includes('T') ? assignment.date.split('T')[0] : assignment.date;
    if (!base) return;
    const target = new Date(`${base}T00:00:00`);
    target.setDate(target.getDate() + days);
    const newDate = format(target, 'yyyy-MM-dd');

    // updateAssignment validates title/location/times and relinks employees, so
    // pass the full assignment (with employee IDs, not display names).
    const buildPayload = (date: string): Partial<Assignment> => ({
      title: assignment.title,
      description: assignment.description,
      location: assignment.location,
      fromTime: assignment.fromTime,
      toTime: assignment.toTime,
      date,
      case_number: assignment.case_number,
      published: assignment.published,
      responsibleUserId: assignment.responsibleUserId,
      car: assignment.car,
      cars: assignment.cars,
      employees: assignment.assignedEmployees?.map(e => e.id) ?? [],
      ...(assignment.lat != null ? { lat: assignment.lat } : {}),
      ...(assignment.lng != null ? { lng: assignment.lng } : {}),
    });

    try {
      await updateAssignment(assignment.id, buildPayload(newDate));
      sonnerToast.success(
        t('ui.movedTo', { date: target.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) }),
        {
          duration: 6000,
          action: {
            label: t('ui.undo'),
            onClick: () => {
              updateAssignment(assignment.id, buildPayload(base)).catch(() => {
                sonnerToast.error(t('ui.undoMoveFailed'));
              });
            },
          },
        }
      );
    } catch (err) {
      sonnerToast.error(t('ui.moveFailed'));
      if (import.meta.env.DEV) console.error('[PlannerPage] Quick move failed:', err);
    }
  }, [updateAssignment, t, currentLanguage]);

  const plannerActions = useMemo(() => ({ quickMove: handleQuickMove }), [handleQuickMove]);



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

  // NOTE: We intentionally do NOT return a full-page skeleton while loading.
  // Swapping the whole page caused large layout shifts (CLS ~0.7 on /planner).
  // The header renders immediately and only the content area shows the skeleton.

  
  if (error) {
    return (
      <div className="min-h-dvh w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">{t('common.error')}</h2>
          <p className="text-muted-foreground">{typeof error === 'string' ? error : t('ui.unexpectedError')}</p>
        </div>
      </div>
    );
  }

  return (
    <DataFetchErrorBoundary>
    <div className="min-h-dvh w-full bg-background">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-5 space-y-3 sm:space-y-4">
        {/* Clean Header — Apple/Arc style */}
        <PlannerHeader
          selectedWeek={selectedWeek}
          selectedYear={selectedYear}
          weekDates={weekDates}
          viewMode={viewMode}
          setViewMode={setViewMode}
          handlePreviousWeek={handlePreviousWeek}
          handleNextWeek={handleNextWeek}
          handlePrefetchAssignments={handlePrefetchAssignments}
          handleCancelPrefetch={handleCancelPrefetch}
          handleShowOnScreen={handleShowOnScreen}
          handleOpenCreateDialog={handleOpenCreateDialog}
        />

        {/* Quick sub-department switch, so users don't have to go via the dashboard */}
        <SubDepartmentQuickSwitcher />

        {/* Filters: quick search + employee multi-select + postcode proximity lookup */}
        <PlannerFilterBar
          employees={employees}
          selectedEmployeeIds={selectedEmployeeIds}
          onSelectedEmployeeIdsChange={setSelectedEmployeeIds}
          postcode={filterPostcode}
          onPostcodeChange={setFilterPostcode}
          weekAssignments={weekAssignments}
          weekDates={weekDates}
          showProximity={canCreate || canPublishTasks}
          query={searchQuery}
          onQueryChange={setSearchQuery}
        />

        {/* Main Content — skeleton reserves the same vertical space as the week list */}

        {loading ? (
          <div aria-label={`${t('common.loading')}...`}>
            <ListSkeleton rowCount={5} rowHeight={168} variant="card" className="p-0 sm:p-0" />
          </div>
        ) : (
          <PlannerActionsProvider value={plannerActions}>
            <PlannerContent 
              weekAssignments={sortedWeekAssignments} 
              allAssignments={assignments}
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
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
              selectedYear={selectedYear} 
              weekDates={weekDates}
              viewMode={viewMode}
              selectedIds={selectedIds}
              selectionActive={selectedIds.size > 0}
              onToggleSelect={handleToggleSelect}
              allExpanded={allExpanded}
              onToggleAllExpanded={handleToggleAllExpanded}
              employees={employees || []}
              cars={cars || []}
            />
          </PlannerActionsProvider>
        )}


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
              employeesLoading={employeesLoading}
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

        <PlannerBulkActions
          selectedIds={selectedIds}
          clearSelection={clearSelection}
          weekAssignments={weekAssignments}
          refetch={refetch}
          deleteAssignment={deleteAssignment}
        />
      </div>
    </div>
    </DataFetchErrorBoundary>
  );
};

export default PlannerPage;
