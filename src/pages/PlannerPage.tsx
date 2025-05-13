
import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import PageHeader from '../components/Layout/PageHeader';
import PlannerHeader from '../components/Planner/PlannerHeader';
import AssignmentDialogManager from '../components/Planner/AssignmentDialogManager';
import AssignmentList from '../components/Planner/AssignmentList';
import { useTranslation } from '../context/TranslationContext';
import { Assignment } from '../types/assignment';
import { getUnpublishedAssignment } from '../hooks/useAssignmentPublishing';
import { usePlannerAssignments } from '../hooks/usePlannerAssignments';
import { 
  getWeekDates, 
  getCurrentWeekInfo, 
  getPreviousWeekInfo, 
  getNextWeekInfo, 
  formatWeekDateRange 
} from '@/utils/weekDates';

const PlannerPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  
  // Get current week info (week number and year)
  const currentWeekInfo = getCurrentWeekInfo();
  
  // State to track the selected week number and year
  const [selectedWeek, setSelectedWeek] = useState(currentWeekInfo.week);
  const [selectedYear, setSelectedYear] = useState(currentWeekInfo.year);
  
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

  // Get the date range for the selected week
  const weekDates = getWeekDates(selectedWeek, selectedYear);
  const locale = currentLanguage === 'da' ? da : undefined;
  
  // Format the date range
  const dateRangeText = formatWeekDateRange(weekDates, currentLanguage);

  // Navigate to previous week
  const handlePreviousWeek = useCallback(() => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  }, [selectedWeek, selectedYear]);

  // Navigate to next week
  const handleNextWeek = useCallback(() => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  }, [selectedWeek, selectedYear]);

  // Handle assignment creation/editing with useCallback to prevent unnecessary re-renders
  const handleOpenCreateDialog = useCallback((date: string) => {
    setCurrentAssignment(null);
    setSelectedDay(date);
    
    // Set form data in one update to avoid race conditions
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
    
    setIsDialogOpen(true);
  }, [setCurrentAssignment, setIsDialogOpen]);

  const handleOpenEditDialog = useCallback((assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setSelectedDay(assignment.date);
    
    // Set form data at once to avoid multiple renders
    setFormData({...assignment});
    
    setIsDialogOpen(true);
  }, [setCurrentAssignment, setIsDialogOpen]);

  const handleSubmit = useCallback((data: Partial<Assignment>) => {
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
  }, [currentAssignment, createAssignment, updateAssignment, setIsDialogOpen]);

  // Fixed wrapper function that uses selectedDay internally - use useCallback to prevent unnecessary re-renders
  const handlePublishDay = useCallback(() => {
    if (selectedDay) {
      publishAssignmentsByDate(selectedDay);
    }
  }, [selectedDay, publishAssignmentsByDate]);

  return (
    <div>
      <PageHeader 
        title={t("navigation.planner")} 
        description={t("planner.weekDescription", { week: selectedWeek })}
      />
      
      <div className="text-sm text-muted-foreground mb-6">
        {dateRangeText ? dateRangeText : t('planner.weekDateRange', { 
          start: format(weekDates.start, 'd MMMM', { locale }), 
          end: format(weekDates.end, 'd MMMM', { locale })
        })}
      </div>

      <PlannerHeader 
        currentWeek={selectedWeek}
        currentYear={selectedYear}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onCreateNew={handleOpenCreateDialog}
      />

      <AssignmentList
        assignments={assignments}
        onEditAssignment={handleOpenEditDialog}
        onDeleteAssignment={deleteAssignment}
        onPublishAssignment={publishAssignment}
        onPublishDay={handlePublishDay}
        onCreateAssignment={handleOpenCreateDialog}
        selectedWeek={selectedWeek}
        selectedYear={selectedYear}
        weekDates={weekDates}
      />

      {/* Only render dialog when it's actually open */}
      {isDialogOpen && (
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
      )}
    </div>
  );
};

export default PlannerPage;
