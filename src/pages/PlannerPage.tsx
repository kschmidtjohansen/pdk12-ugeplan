
import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { da } from 'date-fns/locale';
import PageHeader from '../components/Layout/PageHeader';
import PlannerHeader from '../components/Planner/PlannerHeader';
import AssignmentDialogManager from '../components/Planner/AssignmentDialogManager';
import AssignmentList from '../components/Planner/AssignmentList';
import { useTranslation } from '../context/TranslationContext';
import { Assignment, getCurrentWeek } from '../types/assignment';
import { getUnpublishedAssignment } from '../hooks/useAssignmentPublishing';
import { usePlannerAssignments, getWeekDates } from '../hooks/usePlannerAssignments';

const PlannerPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const { 
    assignments, 
    createAssignment, 
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate
  } = usePlannerAssignments(currentWeek); // Pass currentWeek to the hook

  // Using state for managing dialog and form data
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
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

  // Get week date range
  const { start, end } = getWeekDates(currentWeek);
  const dateFormat = currentLanguage === 'da' ? 'd. MMMM' : 'MMMM d';
  const locale = currentLanguage === 'da' ? da : undefined;
  const dateRangeText = `${format(start, dateFormat, { locale })} - ${format(end, dateFormat, { locale })}`;

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
      createAssignment({
        ...data,
        id: Date.now().toString(),
        published: false
      } as Assignment);
    }
    setDialogOpen(false);
  };

  // Fixed wrapper function that takes no parameters but uses selectedDay internally
  const handlePublishDay = () => {
    if (selectedDay) {
      publishAssignmentsByDate(selectedDay);
    }
  };

  return (
    <div>
      <PageHeader 
        title={t("navigation.planner")} 
        description={t("planner.weekDescription", { week: currentWeek })}
      />
      
      <div className="text-sm text-muted-foreground mb-6">
        {dateRangeText}
      </div>

      <PlannerHeader 
        currentWeek={currentWeek} 
        setCurrentWeek={setCurrentWeek}
        onCreateNew={handleOpenCreateDialog}
      />

      <AssignmentList
        assignments={assignments}
        onEditAssignment={handleOpenEditDialog}
        onDeleteAssignment={deleteAssignment}
        onPublishAssignment={publishAssignment}
        onPublishDay={handlePublishDay}
        onCreateAssignment={handleOpenCreateDialog}
        selectedWeek={currentWeek}
        weekDates={getWeekDates(currentWeek)} // Pass week dates
      />

      <AssignmentDialogManager
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editMode={editMode}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onDelete={deleteAssignment}
        onPublish={publishAssignment}
        assignments={assignments}
        selectedDay={selectedDay}
        onPublishDay={handlePublishDay}
      />
    </div>
  );
};

export default PlannerPage;
