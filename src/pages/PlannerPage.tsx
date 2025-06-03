
import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { usePlannerPage } from '../hooks/usePlannerPage';
import PlannerPageHeader from '../components/Planner/PlannerPageHeader';
import PlannerContent from '../components/Planner/PlannerContent';
import PlannerDialogContainer from '../components/Planner/PlannerDialogContainer';
import { Clock } from 'lucide-react';

const PlannerPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  
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

  return (
    <div className="space-y-8">
      {/* Enhanced Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white shadow-large animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t("navigation.planner")}
            </h1>
            <p className="text-blue-100 text-lg">
              {t('planner.weekView', { 
                week: selectedWeek, 
                year: selectedYear,
                start: weekDates?.start ? weekDates.start.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB') : '',
                end: weekDates?.end ? weekDates.end.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB') : ''
              })}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="p-3 rounded-xl bg-white/10">
              <Clock className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Planner Header with Actions */}
      <div className="animate-slide-in-right">
        <PlannerPageHeader
          selectedWeek={selectedWeek}
          selectedYear={selectedYear}
          weekDates={weekDates}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onCreateNew={handleOpenCreateDialog}
          onPublishAllUnpublished={handlePublishAllUnpublished}
        />
      </div>

      {/* Planner Content */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <PlannerContent
          weekAssignments={sortedWeekAssignments}
          onEditAssignment={handleOpenEditDialog}
          onDeleteAssignment={deleteAssignment}
          onPublishAssignment={publishAssignment}
          onPublishDay={handlePublishDay}
          onCreateAssignment={handleOpenCreateDialog}
          onCopyAssignment={handleCopyAssignment}
          selectedWeek={selectedWeek}
          selectedYear={selectedYear}
          weekDates={weekDates}
        />
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
        selectedDay={selectedDay}
        onPublishDay={handlePublishDay}
      />
    </div>
  );
};

export default PlannerPage;
