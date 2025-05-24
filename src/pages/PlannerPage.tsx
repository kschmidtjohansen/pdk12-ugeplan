
import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { usePlannerPage } from '../hooks/usePlannerPage';
import PlannerPageHeader from '../components/Planner/PlannerPageHeader';
import PlannerContent from '../components/Planner/PlannerContent';
import PlannerDialogContainer from '../components/Planner/PlannerDialogContainer';
import { getUnpublishedAssignment } from '../hooks/useAssignmentPublishing';

const PlannerPage: React.FC = () => {
  const { currentLanguage } = useTranslation();
  
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
    deleteAssignment,
    publishAssignment,
    handleCopyAssignment
  } = usePlannerPage();

  // Sort weekAssignments by date (ascending - earliest first), then by time
  const sortedWeekAssignments = React.useMemo(() => {
    if (!weekAssignments) return [];
    
    // Create a copy to avoid mutating the original array
    return [...weekAssignments].sort((a, b) => {
      // First sort by date (ascending - earliest first)
      if (a.date !== b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      // If same date, sort by fromTime (ascending - earliest first)
      return a.fromTime.localeCompare(b.fromTime);
    });
  }, [weekAssignments]);

  // Add some debugging to see that we have the correct week dates
  console.log("PlannerPage: Rendering with week dates", {
    week: selectedWeek,
    year: selectedYear,
    start: weekDates?.start?.toISOString(),
    end: weekDates?.end?.toISOString()
  });

  return (
    <div>
      <PlannerPageHeader
        selectedWeek={selectedWeek}
        selectedYear={selectedYear}
        weekDates={weekDates}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onCreateNew={handleOpenCreateDialog}
      />

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
