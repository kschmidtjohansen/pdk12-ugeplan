
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
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Clean Page Header */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-gray-900">
                {t("navigation.planner")}
              </h1>
              <p className="text-sm text-gray-600">
                {t('planner.weekView', { 
                  week: selectedWeek, 
                  year: selectedYear,
                  start: weekDates?.start ? weekDates.start.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB') : '',
                  end: weekDates?.end ? weekDates.end.toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB') : ''
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Planner Header with Actions */}
        <PlannerPageHeader
          selectedWeek={selectedWeek}
          selectedYear={selectedYear}
          weekDates={weekDates}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onCreateNew={handleOpenCreateDialog}
          onPublishAllUnpublished={handlePublishAllUnpublished}
        />

        {/* Planner Content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6">
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
    </div>
  );
};

export default PlannerPage;
