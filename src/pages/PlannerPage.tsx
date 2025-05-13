
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
    publishAssignment
  } = usePlannerPage();

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
        weekAssignments={weekAssignments}
        onEditAssignment={handleOpenEditDialog}
        onDeleteAssignment={deleteAssignment}
        onPublishAssignment={publishAssignment}
        onPublishDay={handlePublishDay}
        onCreateAssignment={handleOpenCreateDialog}
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
