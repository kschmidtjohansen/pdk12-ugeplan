import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '../context/TranslationContext';
import { useOptimizedAssignments } from '../hooks/useOptimizedAssignments';
import { Assignment } from '../types/assignment';
import { useEmployees } from '../hooks/useEmployees';
import { useCars } from '../hooks/car';
import { useVacations } from '../hooks/useVacations';
import { useAuth } from '../context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import PlannerContent from '../components/Planner/PlannerContent';
import PlannerDialogContainer from '../components/Planner/PlannerDialogContainer';
import { ChevronLeft, ChevronRight, Plus, Monitor, LayoutGrid, LayoutList, List, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, addWeeks, format } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import PlannerSearchFilter from '@/components/Planner/PlannerSearchFilter';

const PlannerPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const { canCreate, canPublishTasks } = usePermissions();
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();
  
  const {
    assignments, loading, error, operationStates,
    refetch, createAssignment, updateAssignment, deleteAssignment,
    publishAssignment, publishAssignmentsByDate
  } = useOptimizedAssignments('all');

  const [selectedWeek, setSelectedWeek] = useState(() => {
    const saved = localStorage.getItem('plannerSelectedWeek');
    return saved ? parseInt(saved, 10) : getISOWeek(new Date());
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('plannerSelectedYear');
    return saved ? parseInt(saved, 10) : getISOWeekYear(new Date());
  });
  const [viewMode, setViewMode] = useState<'standard' | 'compact' | 'grid'>(() => {
    const saved = localStorage.getItem('plannerViewMode');
    return (saved === 'compact' || saved === 'standard' || saved === 'grid') ? saved : 'standard';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return { [today]: true };
  });
  const [allExpanded, setAllExpanded] = useState(false);
  
  const handleToggleExpansion = useCallback((date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !(prev[date] ?? false) }));
  }, []);
  
  const getAllWeekDays = useCallback((dates: { start: Date; end: Date }) => {
    const days: string[] = [];
    const current = new Date(dates.start);
    while (current <= dates.end) {
      days.push(format(current, 'yyyy-MM-dd'));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, []);
  
  useEffect(() => { localStorage.setItem('plannerViewMode', viewMode); }, [viewMode]);
  useEffect(() => {
    localStorage.setItem('plannerSelectedWeek', selectedWeek.toString());
    localStorage.setItem('plannerSelectedYear', selectedYear.toString());
  }, [selectedWeek, selectedYear]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: '', description: '', date: new Date().toISOString().split('T')[0],
    fromTime: '08:00', toTime: '16:00', location: '', car: '', employees: []
  });

  const getWeekDates = (week: number, year: number) => {
    const jan4 = new Date(year, 0, 4);
    const weekStart = startOfISOWeek(addWeeks(jan4, week - 1));
    const weekEnd = endOfISOWeek(weekStart);
    return { start: weekStart, end: weekEnd, weekNumber: week, year };
  };

  const weekDates = getWeekDates(selectedWeek, selectedYear);
  
  const handleToggleAllExpanded = useCallback(() => {
    const newExpanded = !allExpanded;
    setAllExpanded(newExpanded);
    if (weekDates) {
      const newExpandedDays: Record<string, boolean> = {};
      getAllWeekDays(weekDates).forEach(dateStr => { newExpandedDays[dateStr] = newExpanded; });
      setExpandedDays(newExpandedDays);
    }
  }, [allExpanded, weekDates, getAllWeekDays]);
  
  const weekAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      return getISOWeek(assignmentDate) === selectedWeek && getISOWeekYear(assignmentDate) === selectedYear;
    });
  }, [assignments, selectedWeek, selectedYear]);

  const filteredWeekAssignments = useMemo(() => {
    if (!searchQuery.trim()) return weekAssignments;
    const query = searchQuery.toLowerCase().trim();
    return weekAssignments.filter(assignment => {
      if (assignment.case_number?.toLowerCase().includes(query)) return true;
      if (assignment.title?.toLowerCase().includes(query)) return true;
      if (assignment.location?.toLowerCase().includes(query)) return true;
      if (assignment.assignedEmployees?.some(emp => 
        (typeof emp === 'object' ? emp.name : emp)?.toLowerCase().includes(query)
      )) return true;
      return false;
    });
  }, [weekAssignments, searchQuery]);

  const handlePreviousWeek = () => {
    const currentWeekStart = getWeekDates(selectedWeek, selectedYear).start;
    const prevWeekStart = addWeeks(currentWeekStart, -1);
    setSelectedWeek(getISOWeek(prevWeekStart));
    setSelectedYear(getISOWeekYear(prevWeekStart));
  };

  const handleNextWeek = () => {
    const currentWeekStart = getWeekDates(selectedWeek, selectedYear).start;
    const nextWeekStart = addWeeks(currentWeekStart, 1);
    setSelectedWeek(getISOWeek(nextWeekStart));
    setSelectedYear(getISOWeekYear(nextWeekStart));
  };

  const handleOpenCreateDialog = (date: string) => {
    setCurrentAssignment(null);
    setSelectedDay(date);
    setFormData({ title: '', description: '', date, fromTime: '08:00', toTime: '16:00', location: '', car: '', employees: [], published: false });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (assignment: Assignment) => {
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

  const handleSubmit = async (data: Partial<Assignment>) => {
    try {
      if (currentAssignment?.id) {
        await updateAssignment(currentAssignment.id, data);
        setCurrentAssignment(null);
        setFormData({ title: '', description: '', date: new Date().toISOString().split('T')[0], fromTime: '08:00', toTime: '16:00', location: '', car: '', employees: [], published: false });
        setIsDialogOpen(false);
      } else {
        await createAssignment(data);
        setFormData({ title: '', description: '', date: new Date().toISOString().split('T')[0], fromTime: '08:00', toTime: '16:00', location: '', car: '', employees: [], published: false });
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('[PlannerPage] Operation failed:', error);
    }
  };

  const handleCopyAssignment = (assignment: Assignment) => {
    setCurrentAssignment(null);
    const today = new Date().toISOString().split('T')[0];
    setSelectedDay(today);
    setFormData({
      ...assignment, id: undefined, date: today, published: false,
      employees: assignment.employees ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : ''
    });
    setIsDialogOpen(true);
  };

  const sortedWeekAssignments = useMemo(() => {
    if (!filteredWeekAssignments) return [];
    return [...filteredWeekAssignments].sort((a, b) => {
      if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
      return a.fromTime.localeCompare(b.fromTime);
    });
  }, [filteredWeekAssignments]);

  const handlePublishDay = useCallback(async (date: string) => { await publishAssignmentsByDate(date); }, [publishAssignmentsByDate]);
  const handleDeleteAssignment = useCallback(async (id: string) => { await deleteAssignment(id); }, [deleteAssignment]);
  const handlePublishAssignment = useCallback(async (id: string) => { await publishAssignment(id); }, [publishAssignment]);

  const handleEmployeeToggle = useCallback((employeeId: string) => {
    if (!employeeId || employeeId.trim() === '') return;
    setFormData(prev => {
      const currentEmployees = prev.employees || [];
      const newEmployees = currentEmployees.includes(employeeId)
        ? currentEmployees.filter(id => id !== employeeId)
        : [...currentEmployees, employeeId];
      return { ...prev, employees: newEmployees };
    });
  }, []);

  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();

  const handleShowOnScreen = () => {
    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({ date: today, t: String(Date.now()), source: 'button' });
    if (selectedDepartmentId) params.set('departmentId', selectedDepartmentId);
    if (selectedSubDepartmentId) params.set('subDepartmentId', selectedSubDepartmentId);
    window.open(`/screen-display?${params.toString()}`, '_blank', 'fullscreen=yes');
  };

  const convertedOperationStates: Record<string, 'publishing' | 'deleting' | 'updating' | null> = useMemo(() => {
    const converted: Record<string, 'publishing' | 'deleting' | 'updating' | null> = {};
    Object.entries(operationStates).forEach(([key, value]) => {
      converted[key] = value === 'loading' ? 'updating' : null;
    });
    return converted;
  }, [operationStates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">{t('common.error')}</h2>
          <p className="text-muted-foreground text-sm">{typeof error === 'string' ? error : 'An error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <DataFetchErrorBoundary>
      <div className="space-y-4">
        {/* Simple Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {weekDates?.start ? weekDates.start.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB') : ''} — {weekDates?.end ? weekDates.end.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB') : ''}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("navigation.planner")}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Week Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[80px] text-center">
                {t('planner.week')} {selectedWeek}
              </span>
              <Button variant="outline" size="icon-sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {canPublishTasks && (
              <Button variant="outline" size="sm" onClick={handleShowOnScreen}>
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">{t('planner.showOnScreen')}</span>
              </Button>
            )}
            {canCreate && (
              <Button size="sm" onClick={() => handleOpenCreateDialog(new Date().toISOString().split('T')[0])}>
                <Plus className="h-4 w-4" />
                {t('planner.newAssignment')}
              </Button>
            )}
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-card rounded-lg border p-3">
          <PlannerSearchFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          
          <div className="hidden sm:flex items-center gap-2">
            <ToggleGroup 
              type="single" value={viewMode} 
              onValueChange={(v) => v && setViewMode(v as 'standard' | 'compact' | 'grid')}
              className="bg-muted/50 rounded-md p-0.5"
            >
              <ToggleGroupItem value="standard" size="sm" className="h-7 px-2.5 data-[state=on]:bg-background text-xs">
                <List className="h-3.5 w-3.5 mr-1" />
                {t('planner.viewModeStandard')}
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" size="sm" className="h-7 px-2.5 data-[state=on]:bg-background text-xs">
                <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                {currentLanguage === 'da' ? 'Gitter' : 'Grid'}
              </ToggleGroupItem>
              <ToggleGroupItem value="compact" size="sm" className="h-7 px-2.5 data-[state=on]:bg-background text-xs">
                <LayoutList className="h-3.5 w-3.5 mr-1" />
                {t('planner.viewModeCompact')}
              </ToggleGroupItem>
            </ToggleGroup>
            
            {(viewMode === 'standard' || viewMode === 'grid') && (
              <Button variant="outline" size="sm" onClick={handleToggleAllExpanded} className="h-7 px-2.5 text-xs">
                <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
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
          <div className="text-xs text-muted-foreground">
            {sortedWeekAssignments.length === 0 ? (
              <span>{t('planner.noSearchResults')}</span>
            ) : (
              <span>
                {currentLanguage === 'da' 
                  ? `${sortedWeekAssignments.length} ${sortedWeekAssignments.length === 1 ? 'opgave' : 'opgaver'} fundet`
                  : `${sortedWeekAssignments.length} ${sortedWeekAssignments.length === 1 ? 'assignment' : 'assignments'} found`
                }
              </span>
            )}
          </div>
        )}

        {/* Main Content */}
        <PlannerContent 
          weekAssignments={sortedWeekAssignments} 
          operationStates={convertedOperationStates}
          expandedDays={expandedDays}
          onToggleExpansion={handleToggleExpansion}
          onEditAssignment={handleOpenEditDialog} 
          onDeleteAssignment={handleDeleteAssignment} 
          onPublishAssignment={handlePublishAssignment} 
          onPublishDay={handlePublishDay} 
          onCreateAssignment={handleOpenCreateDialog} 
          onCopyAssignment={handleCopyAssignment} 
          selectedWeek={selectedWeek} 
          selectedYear={selectedYear} 
          weekDates={weekDates}
          viewMode={viewMode}
        />

        <PlannerDialogContainer 
          isDialogOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          onSubmit={handleSubmit} 
          currentAssignment={currentAssignment} 
          selectedDay={selectedDay} 
          formData={formData} 
          setFormData={setFormData} 
          employees={employees} 
          cars={cars} 
          vacations={vacations} 
          assignments={sortedWeekAssignments} 
          onEmployeeToggle={handleEmployeeToggle} 
        />
      </div>
    </DataFetchErrorBoundary>
  );
};

export default PlannerPage;
