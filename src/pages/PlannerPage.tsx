import React, { useCallback } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { useAssignmentDataOptimized } from '../hooks/assignment/useAssignmentDataOptimized';
import { useAssignmentActions } from '../hooks/assignment/useAssignmentActions';
import { Assignment } from '../types/assignment';
import { useEmployees } from '../hooks/useEmployees';
import { useCars } from '../hooks/car';
import { useVacations } from '../hooks/useVacations';
import { useAuth } from '../context/AuthContext';
import PlannerContent from '../components/Planner/PlannerContent';
import PlannerDialogContainer from '../components/Planner/PlannerDialogContainer';
import { Clock, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';
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
  
  // Use enhanced data fetching for better employee name handling
  const {
    assignments,
    loading,
    error,
    fetchAssignments
  } = useAssignmentDataOptimized();
  
  // Use assignment actions for operations
  const {
    createAssignment,
    updateAssignment,
    deleteAssignment: deleteAssignmentAction,
    publishAssignment: publishAssignmentAction,
    publishAssignmentsByDate
  } = useAssignmentActions(fetchAssignments);

  // Simplified planner state management without conflicting hooks
  const [selectedWeek, setSelectedWeek] = React.useState(() => {
    const today = new Date();
    const onejan = new Date(today.getFullYear(), 0, 1);
    return Math.ceil(((today.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  });
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [currentAssignment, setCurrentAssignment] = React.useState<Assignment | null>(null);
  const [selectedDay, setSelectedDay] = React.useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = React.useState<Partial<Assignment>>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    fromTime: '08:00',
    toTime: '16:00',
    location: '',
    car: '',
    employees: []
  });

  // Week utilities
  const getWeekDates = (week: number, year: number) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const weekStart = new Date(simple);
    if (dow <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else weekStart.setDate(simple.getDate() + 8 - simple.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { start: weekStart, end: weekEnd, weekNumber: week, year };
  };

  const weekDates = getWeekDates(selectedWeek, selectedYear);
  
  // Filter assignments by week
  const weekAssignments = React.useMemo(() => {
    if (!assignments || assignments.length === 0) return [];
    
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentWeek = Math.ceil(((assignmentDate.getTime() - new Date(selectedYear, 0, 1).getTime()) / 86400000 + new Date(selectedYear, 0, 1).getDay() + 1) / 7);
      return assignmentWeek === selectedWeek && assignmentDate.getFullYear() === selectedYear;
    });
  }, [assignments, selectedWeek, selectedYear]);

  // Handlers
  const handlePreviousWeek = () => {
    if (selectedWeek === 1) {
      setSelectedWeek(52);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedWeek(selectedWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek === 52) {
      setSelectedWeek(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedWeek(selectedWeek + 1);
    }
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
        const success = await updateAssignment(currentAssignment.id, data);
        if (success) {
          console.log('[PlannerPage] Assignment updated successfully');
          setCurrentAssignment(null);
          // Reset form data for next use
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
        }
      } else {
        console.log('[PlannerPage] Creating new assignment');
        await createAssignment(data);
        console.log('[PlannerPage] Assignment created successfully');
        // Reset form data for next use
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
      }
      // Let useAssignmentActions handle dialog closing after refetch completes
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

  const sortedWeekAssignments = React.useMemo(() => {
    if (!weekAssignments) return [];
    return [...weekAssignments].sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.fromTime.localeCompare(b.fromTime);
    });
  }, [weekAssignments]);

  // Define handlers that use the optimized hooks - MUST be before any conditional returns
  const handlePublishDay = useCallback(async (date: string) => {
    await publishAssignmentsByDate(date);
  }, [publishAssignmentsByDate]);

  const deleteAssignment = useCallback(async (id: string) => {
    await deleteAssignmentAction(id);
  }, [deleteAssignmentAction]);

  const publishAssignment = useCallback(async (id: string) => {
    await publishAssignmentAction(id);
  }, [publishAssignmentAction]);

  // Handle employee toggle (add/remove from array)
  const handleEmployeeToggle = useCallback((employeeId: string) => {
    console.log('[PlannerPage] Employee toggled:', employeeId);
    console.log('[PlannerPage] Current employees:', formData.employees);
    
    if (!employeeId || employeeId.trim() === '') {
      console.warn('[PlannerPage] Invalid employee ID provided');
      return;
    }

    setFormData(prev => {
      const currentEmployees = prev.employees || [];
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
  }, [formData.employees, setFormData]);

  const handleShowOnScreen = () => {
    const today = new Date().toISOString().split('T')[0];
    const screenUrl = `/screen-display?date=${today}&t=${Date.now()}&source=button`;
    window.open(screenUrl, '_blank', 'fullscreen=yes');
  };

  if (loading) {
    return <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-lg font-medium text-gray-600">{t('common.loading')}...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600">{typeof error === 'string' ? error : 'An error occurred'}</p>
        </div>
      </div>;
  }

  // No operation states needed with the enhanced data fetching
  const emptyOperationStates: Record<string, 'publishing' | 'deleting' | 'updating'> = {};

  return <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-8">
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

                {/* Create Assignment Button */}
                {canCreate && <Button onClick={() => handleOpenCreateDialog(new Date().toISOString().split('T')[0])} size="sm" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                    <Plus className="h-4 w-4" />
                    {t('planner.newAssignment')}
                  </Button>}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <PlannerContent weekAssignments={sortedWeekAssignments} operationStates={emptyOperationStates} onEditAssignment={handleOpenEditDialog} onDeleteAssignment={deleteAssignment} onPublishAssignment={publishAssignment} onPublishDay={handlePublishDay} onCreateAssignment={handleOpenCreateDialog} onCopyAssignment={handleCopyAssignment} selectedWeek={selectedWeek} selectedYear={selectedYear} weekDates={weekDates} handleShowOnScreen={handleShowOnScreen} />

        {/* Assignment Dialog */}
        <PlannerDialogContainer isDialogOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={handleSubmit} currentAssignment={currentAssignment} selectedDay={selectedDay} formData={formData} setFormData={setFormData} employees={employees} cars={cars} vacations={vacations} assignments={sortedWeekAssignments} onEmployeeToggle={handleEmployeeToggle} />
      </div>
    </div>;
};
export default PlannerPage;