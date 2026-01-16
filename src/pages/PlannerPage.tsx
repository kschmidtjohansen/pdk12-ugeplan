import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { useOptimizedAssignments } from '../hooks/useOptimizedAssignments';
import { Assignment } from '../types/assignment';
import { useEmployees } from '../hooks/useEmployees';
import { useCars } from '../hooks/car';
import { useVacations } from '../hooks/useVacations';
import { useAuth } from '../context/AuthContext';
import PlannerContent from '../components/Planner/PlannerContent';
import PlannerDialogContainer from '../components/Planner/PlannerDialogContainer';
import { Clock, ChevronLeft, ChevronRight, Plus, Monitor, LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, addWeeks } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import PlannerSearchFilter from '@/components/Planner/PlannerSearchFilter';

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
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate
  } = useOptimizedAssignments('all');

  // Simplified planner state management using ISO week numbers
  const [selectedWeek, setSelectedWeek] = useState(() => getISOWeek(new Date()));
  const [selectedYear, setSelectedYear] = useState(() => getISOWeekYear(new Date()));
  
  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<'standard' | 'compact'>(() => {
    const saved = localStorage.getItem('plannerViewMode');
    return (saved === 'compact' || saved === 'standard') ? saved : 'compact';
  });
  
  // Search filter state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Persist view mode
  useEffect(() => {
    localStorage.setItem('plannerViewMode', viewMode);
  }, [viewMode]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
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

  // Week utilities using date-fns for accurate ISO week handling
  const getWeekDates = (week: number, year: number) => {
    const jan4 = new Date(year, 0, 4);
    const weekStart = startOfISOWeek(addWeeks(jan4, week - 1));
    const weekEnd = endOfISOWeek(weekStart);
    return { start: weekStart, end: weekEnd, weekNumber: week, year };
  };

  const weekDates = getWeekDates(selectedWeek, selectedYear);
  
  // Filter assignments by week using ISO week numbers
  const weekAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];
    
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentWeek = getISOWeek(assignmentDate);
      const assignmentYear = getISOWeekYear(assignmentDate);
      return assignmentWeek === selectedWeek && assignmentYear === selectedYear;
    });
  }, [assignments, selectedWeek, selectedYear]);

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

  // Handlers - use date-fns for proper week navigation
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
    console.log('[PlannerPage] Form submission started with data:', data);
    try {
      if (currentAssignment?.id) {
        console.log('[PlannerPage] Updating existing assignment:', currentAssignment.id);
        await updateAssignment(currentAssignment.id, data);
        console.log('[PlannerPage] Assignment updated successfully');
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
        console.log('[PlannerPage] Creating new assignment');
        await createAssignment(data);
        console.log('[PlannerPage] Assignment created successfully');
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
      console.error('[PlannerPage] Operation failed:', error);
    }
  };

  const handleCopyAssignment = (assignment: Assignment) => {
    setCurrentAssignment(null);
    const today = new Date().toISOString().split('T')[0];
    setSelectedDay(today);
    setFormData({
      ...assignment,
      id: undefined,
      date: today,
      published: false,
      employees: assignment.employees ? [...assignment.employees] : [],
      car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : ''
    });
    setIsDialogOpen(true);
  };

  const sortedWeekAssignments = useMemo(() => {
    if (!filteredWeekAssignments) return [];
    return [...filteredWeekAssignments].sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.fromTime.localeCompare(b.fromTime);
    });
  }, [filteredWeekAssignments]);

  // Define handlers that use the optimized hooks
  const handlePublishDay = useCallback(async (date: string) => {
    await publishAssignmentsByDate(date);
  }, [publishAssignmentsByDate]);

  const handleDeleteAssignment = useCallback(async (id: string) => {
    await deleteAssignment(id);
  }, [deleteAssignment]);

  const handlePublishAssignment = useCallback(async (id: string) => {
    await publishAssignment(id);
  }, [publishAssignment]);

  const handleEmployeeToggle = useCallback((employeeId: string) => {
    console.log('[PlannerPage] Employee toggled:', employeeId);
    
    if (!employeeId || employeeId.trim() === '') {
      console.warn('[PlannerPage] Invalid employee ID provided');
      return;
    }

    setFormData(prev => {
      const currentEmployees = prev.employees || [];
      console.log('[PlannerPage] Current employees before toggle:', currentEmployees);
      
      let newEmployees;
      
      if (currentEmployees.includes(employeeId)) {
        newEmployees = currentEmployees.filter(id => id !== employeeId);
        console.log('[PlannerPage] Removing employee:', employeeId);
      } else {
        newEmployees = [...currentEmployees, employeeId];
        console.log('[PlannerPage] Adding employee:', employeeId);
      }
      
      console.log('[PlannerPage] New employees array:', newEmployees);
      
      return {
        ...prev,
        employees: newEmployees
      };
    });
  }, []);

  const handleShowOnScreen = () => {
    const today = new Date().toISOString().split('T')[0];
    const screenUrl = `/screen-display?date=${today}&t=${Date.now()}&source=button`;
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
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-lg font-medium text-gray-600">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600">{typeof error === 'string' ? error : 'An error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Enhanced Header with Responsive Design */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 lg:p-8 text-white shadow-2xl animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>
          
          <div className="relative z-10">
            {/* Header Content - Responsive Layout */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-1 lg:space-y-3">
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                    {t("navigation.planner")}
                  </h1>
                  <p className="text-blue-100 text-sm lg:text-lg font-medium">
                    {t('planner.weekView', {
                      week: selectedWeek,
                      year: selectedYear,
                      start: weekDates?.start ? weekDates.start.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB') : '',
                      end: weekDates?.end ? weekDates.end.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB') : ''
                    })}
                  </p>
                </div>
              </div>

              {/* Controls Section - Responsive */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
                {/* Week Navigation */}
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePreviousWeek} className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="font-medium min-w-[100px] text-center text-white text-lg lg:text-xl">
                    {t('planner.week')} {selectedWeek}
                  </span>
                  
                  <Button variant="outline" size="sm" onClick={handleNextWeek} className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {canPublishTasks && (
                    <Button 
                      onClick={handleShowOnScreen} 
                      size="sm" 
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                    >
                      <Monitor className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('planner.showOnScreen')}</span>
                    </Button>
                  )}
                  {canCreate && (
                    <Button 
                      onClick={() => handleOpenCreateDialog(new Date().toISOString().split('T')[0])} 
                      size="sm" 
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                    >
                      <Plus className="h-4 w-4" />
                      {t('planner.newAssignment')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and View Toggle Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card rounded-lg border p-3">
          {/* Search Filter */}
          <PlannerSearchFilter 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {currentLanguage === 'da' ? 'Visning:' : 'View:'}
            </span>
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(v) => v && setViewMode(v as 'standard' | 'compact')}
              className="bg-muted/50 rounded-lg p-0.5"
            >
              <ToggleGroupItem value="compact" size="sm" className="h-8 px-3 data-[state=on]:bg-background">
                <LayoutList className="h-4 w-4 mr-1.5" />
                <span className="text-xs">{t('planner.viewModeCompact')}</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="standard" size="sm" className="h-8 px-3 data-[state=on]:bg-background">
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                <span className="text-xs">{t('planner.viewModeStandard')}</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Search results indicator */}
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
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

        {/* Assignment Dialog */}
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
    </div>
  );
};

export default PlannerPage;
