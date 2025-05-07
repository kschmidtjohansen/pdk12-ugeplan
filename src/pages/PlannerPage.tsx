
import React, { useState } from 'react';
import { format } from 'date-fns';
import PageHeader from '../components/Layout/PageHeader';
import PlannerHeader from '../components/Planner/PlannerHeader';
import AssignmentDialogManager from '../components/Planner/AssignmentDialogManager';
import { useTranslation } from '../context/TranslationContext';
import { Assignment, getCurrentWeek } from '../types/assignment';
import { getUnpublishedAssignment } from '../hooks/useAssignmentPublishing';
import { usePlannerAssignments } from '../hooks/usePlannerAssignments';

const PlannerPage: React.FC = () => {
  const { t } = useTranslation();
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const { 
    assignments, 
    addAssignment, 
    updateAssignment,
    selectedDay, 
    setSelectedDay,
    deleteAssignment,
    publishAssignment,
    publishDayAssignments
  } = usePlannerAssignments();

  // Using state for managing dialog and form data
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    fromTime: '08:00',
    toTime: '16:00',
    location: '',
    car: '',
    employees: []
  });

  // Handle assignment creation/editing
  const handleOpenCreateDialog = (date: string) => {
    setEditMode(false);
    setDialogOpen(true);
    setSelectedDay(date);
    setFormData({
      title: '',
      description: '',
      date,
      fromTime: '08:00',
      toTime: '16:00',
      location: '',
      car: '',
      employees: []
    });
  };

  const handleOpenEditDialog = (assignment: Assignment) => {
    setEditMode(true);
    setDialogOpen(true);
    setSelectedDay(assignment.date);
    setFormData(assignment);
  };

  const handleSubmit = (data: Partial<Assignment>) => {
    if (editMode) {
      // Set the edited assignment as unpublished
      const unpublishedData = getUnpublishedAssignment(data as Assignment);
      updateAssignment(unpublishedData);
    } else {
      addAssignment({
        ...data,
        id: Date.now().toString(),
        published: false
      } as Assignment);
    }
    setDialogOpen(false);
  };

  return (
    <div>
      <PageHeader 
        title={t("navigation.planner")} 
        description={t("planner.weekDescription", { week: currentWeek })}
      />

      <PlannerHeader 
        currentWeek={currentWeek} 
        setCurrentWeek={setCurrentWeek}
        onCreateNew={handleOpenCreateDialog}
      />

      <AssignmentDialogManager
        open={dialogOpen}
        setOpen={setDialogOpen}
        editMode={editMode}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onDelete={deleteAssignment}
        onPublish={publishAssignment}
        assignments={assignments}
        selectedDay={selectedDay}
        onPublishDay={publishDayAssignments}
      />
    </div>
  );
};

export default PlannerPage;
