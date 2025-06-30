
import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { usePlannerPage } from '../hooks/usePlannerPage';
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
  const { t, currentLanguage } = useTranslation();
  const { canCreate, canPublishTasks } = usePermissions();
  const { user } = useAuth();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();
  
  const {
    selectedWeek,
    selectedYear,
    weekDates,
    weekAssignments,
    loading,
    error,
    operationStates,
    isDialogOpen,
    setIsDialogOpen,
    currentAssignment,
    selectedDay,
    formData,
    setFormData,
    handlePreviousWeek,
    handleNextWeek,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleSubmit,
    handlePublishDay,
    handlePublishAllUnpublished,
    deleteAssignment,
    publishAssignment,
    handleCopyAssignment
  } = usePlannerPage();

  // PHASE 3 DEBUG: Add comprehensive planner debugging
  console.log(`[PlannerPage] PHASE 3 DEBUG - Planner access for user:`, {
    userName: user?.name,
    userRole: user?.role,
    isServicemedarbejder: user?.role === 'servicemedarbejder',
    totalWeekAssignments: weekAssignments?.length || 0,
    selectedWeek,
    selectedYear
  });

  console.log(`[PlannerPage] PHASE 3 DEBUG - Weekly assignments breakdown:`, {
    totalAssignments: weekAssignments?.length || 0,
    publishedAssignments: weekAssignments?.filter(a => a.published).length || 0,
    unpublishedAssignments: weekAssignments?.filter(a => !a.published).length || 0,
    assignmentsWithCurrentUser: weekAssignments?.filter(a => a.employees?.includes(user?.name || '')).length || 0,
    assignmentsWithoutCurrentUser: weekAssignments?.filter(a => !a.employees?.includes(user?.name || '')).length || 0
  });

  // PHASE 3 DEBUG: Log specific assignment details
  weekAssignments?.forEach((assignment, index) => {
    console.log(`[PlannerPage] PHASE 3 DEBUG - Assignment ${index + 1}:`, {
      title: assignment.title,
      published: assignment.published,
      employees: assignment.employees,
      cars: assignment.cars,
      responsibleUser: assignment.responsibleUser,
      currentUserAssigned: assignment.employees?.includes(user?.name || ''),
      shouldBeVisibleToServicemedarbejder: assignment.published
    });
  });

  const sortedWeekAssignments = React.useMemo(() => {
    if (!weekAssignments) return [];
    return [...weekAssignments].sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.fromTime.localeCompare(b.fromTime);
    });
  }, [weekAssignments]);
  
  const handleShowOnScreen = () => {
    const today = new Date().toISOString().split('T')[0];
    const screenUrl = `/screen-display?date=${today}`;
    window.open(screenUrl, '_blank', 'fullscreen=yes');
  };

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

  // Convert operation states to match expected format
  const convertedOperationStates: Record<string, 'publishing' | 'deleting' | 'updating'> = {};
  Object.entries(operationStates).forEach(([key, value]) => {
    if (value === 'loading') {
      convertedOperationStates[key] = 'publishing'; // Map loading to publishing as default
    } else if (value === 'success' || value === 'error' || value === 'idle') {
      // Skip these states as they don't map to the expected operation types
      return;
    }
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
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
                  
                  {/* PHASE 3 DEBUG: Add debug info in header for servicemedarbejder */}
                  {user?.role === 'servicemedarbejder' && (
                    <p className="text-blue-200 text-xs">
                      {t('common.debug')}: {t('dashboard.processing')} {sortedWeekAssignments.length} {t('planner.assignments').toLowerCase()} ({sortedWeekAssignments.filter(a => a.published).length} {t('planner.published').toLowerCase()})
                    </p>
                  )}
                </div>
              </div>

              {/* Controls Section - Responsive */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
                {/* Week Navigation */}
                <div className="flex items-center justify-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePreviousWeek} 
                    className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="font-medium min-w-[100px] text-center text-white text-lg lg:text-xl">
                    {t('planner.week')} {selectedWeek}
                  </span>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextWeek} 
                    className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Create Assignment Button */}
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

        {/* Main Content */}
        <PlannerContent 
          weekAssignments={sortedWeekAssignments}
          operationStates={convertedOperationStates}
          onEditAssignment={handleOpenEditDialog}
          onDeleteAssignment={deleteAssignment}
          onPublishAssignment={publishAssignment}
          onPublishDay={handlePublishDay}
          onCreateAssignment={handleOpenCreateDialog}
          onCopyAssignment={handleCopyAssignment}
          selectedWeek={selectedWeek}
          selectedYear={selectedYear}
          weekDates={weekDates}
          handleShowOnScreen={handleShowOnScreen}
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
        />
      </div>
    </div>
  );
};

export default PlannerPage;
