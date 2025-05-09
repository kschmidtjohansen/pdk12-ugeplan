
import React, { useState } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import PageHeader from '../components/Layout/PageHeader';
import PlannerHeader from '../components/Planner/PlannerHeader';
import AssignmentDialogManager from '../components/Planner/AssignmentDialogManager';
import AssignmentList from '../components/Planner/AssignmentList';
import { useTranslation } from '../context/TranslationContext';
import { Assignment, getCurrentWeek } from '../types/assignment';
import { getUnpublishedAssignment } from '../hooks/useAssignmentPublishing';
import { usePlannerAssignments } from '../hooks/usePlannerAssignments';
import { getWeekDates } from '@/utils/weekDates';

const PlannerPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const { 
    assignments, 
    createAssignment, 
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
    isDialogOpen,
    setIsDialogOpen,
    currentAssignment,
    setCurrentAssignment
  } = usePlannerAssignments();

  // Using state for managing form data
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
  const locale = currentLanguage === 'da' ? da : undefined;
  
  // Format the date range based on the current language
  let dateRangeText = '';
  if (currentLanguage === 'da') {
    dateRangeText = `${format(start, 'd. MMMM', { locale })} - ${format(end, 'd. MMMM', { locale })}`;
  } else {
    dateRangeText = `${format(start, 'MMMM d', { locale })} - ${format(end, 'MMMM d', { locale })}`;
  }

  // Handle assignment creation/editing
  const handleOpenCreateDialog = (date: string) => {
    setCurrentAssignment(null);
    setIsDialogOpen(true);
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
    setCurrentAssignment(assignment);
    setIsDialogOpen(true);
    setSelectedDay(assignment.date);
    setFormData(assignment);
  };

  const handleSubmit = (data: Partial<Assignment>) => {
    if (currentAssignment) {
      // Set the edited assignment as unpublished
      const unpublishedData = getUnpublishedAssignment(data as Assignment);
      updateAssignment(currentAssignment.id, unpublishedData);
    } else {
      createAssignment({
        ...data,
        id: Date.now().toString(),
        published: false
      } as Assignment);
    }
    setIsDialogOpen(false);
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
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editMode={!!currentAssignment}
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
