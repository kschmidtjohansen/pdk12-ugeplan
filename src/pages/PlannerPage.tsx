
import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { usePlannerPage } from '../hooks/usePlannerPage';
import { useEmployees } from '../hooks/useEmployees';
import { useCars } from '../hooks/car';
import { useVacations } from '../hooks/useVacations';
import PlannerContent from '../components/Planner/PlannerContent';
import PlannerDialogContainer from '../components/Planner/PlannerDialogContainer';
import { Clock, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/context/AuthContext';

const PlannerPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const { canCreate, canPublishTasks } = usePermissions();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();
  const {
    selectedWeek,
    selectedYear,
    weekDates,
    weekAssignments,
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

  // Sort weekAssignments by date (ascending - earliest first), then by time
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

                {/* Create Button - Full width on mobile, auto on larger screens */}
                {canCreate && (
                  <Button 
                    onClick={() => handleOpenCreateDialog(new Date().toISOString().split('T')[0])} 
                    size="sm" 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg min-h-[40px]" 
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('planner.createNew')}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Planner Content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6">
            <PlannerContent 
              weekAssignments={weekAssignments} 
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
          </div>
        </div>

        <PlannerDialogContainer 
          isDialogOpen={isDialogOpen} 
          setIsDialogOpen={setIsDialogOpen} 
          currentAssignment={currentAssignment} 
          formData={formData} 
          setFormData={setFormData} 
          onSubmit={handleSubmit} 
          onDelete={deleteAssignment} 
          onPublish={publishAssignment} 
          assignments={weekAssignments} 
          cars={cars}
          employees={employees}
          vacations={vacations}
          selectedDay={selectedDay} 
          onPublishDay={handlePublishDay} 
        />
      </div>
    </div>
  );
};

export default PlannerPage;
