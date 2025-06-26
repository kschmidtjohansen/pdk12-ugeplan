import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Assignment } from '../types/assignment';
import { useOptimizedAssignments } from './useOptimizedAssignments';
import { useAssignmentActions } from './assignment/useAssignmentActions';
import { 
  getWeekDates, 
  getCurrentWeekInfo, 
  getPreviousWeekInfo, 
  getNextWeekInfo
} from '@/utils/dates';
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';

export const usePlannerPage = () => {
  const currentWeekInfo = getCurrentWeekInfo();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedWeek, setSelectedWeek] = useState(currentWeekInfo.week);
  const [selectedYear, setSelectedYear] = useState(currentWeekInfo.year);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // SERVICEMEDARBEJDER FIX: Use 'published' filter for servicemedarbejder to see all tasks, 'all' for admin/skadeleder
  const isAdminOrSkadeleder = user?.role === 'administrator' || user?.role === 'skadeleder';
  const plannerFilter = isAdminOrSkadeleder ? 'all' : 'published';
  
  console.log(`[usePlannerPage] SERVICEMEDARBEJDER FIX - User: ${user?.name} (${user?.role}), Using filter: ${plannerFilter}`);
  
  const { 
    assignments, 
    loading,
    error,
    operationStates,
    refetch,
    deleteAssignment: deleteAssignmentFromHook,
    publishAssignment: publishAssignmentFromHook
  } = useOptimizedAssignments(plannerFilter);

  const {
    createAssignment,
    updateAssignment,
    deleteAssignment: deleteAssignmentAction
  } = useAssignmentActions(refetch, setIsDialogOpen);

  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const { filterByWeek } = useAssignmentFilters();

  console.log(`[usePlannerPage] SERVICEMEDARBEJDER FIX - Received ${assignments.length} assignments for planner display`);
  
  const getFreshToday = useCallback(() => {
    const now = new Date();
    return format(now, 'yyyy-MM-dd');
  }, []);
  
  const [selectedDay, setSelectedDay] = useState<string>(getFreshToday());
  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: '',
    description: '',
    date: getFreshToday(),
    fromTime: '08:00',
    toTime: '16:00',
    location: '',
    car: '',
    employees: []
  });

  React.useEffect(() => {
    const today = getFreshToday();
    setFormData(prev => ({ ...prev, date: today }));
    setSelectedDay(today);
  }, [getFreshToday]);

  const weekDates = getWeekDates(selectedWeek, selectedYear);
  
  // SERVICEMEDARBEJDER FIX: Filter assignments by week with role-based filtering
  const weekAssignments = filterByWeek(assignments, selectedWeek, selectedYear);

  console.log(`[usePlannerPage] SERVICEMEDARBEJDER FIX - Week ${selectedWeek} filtered to ${weekAssignments.length} assignments for display`);
  console.log(`[usePlannerPage] SERVICEMEDARBEJDER FIX - Sample assignments:`, weekAssignments.slice(0, 3).map(a => ({
    title: a.title,
    employees: a.employees,
    cars: a.cars,
    date: a.date,
    published: a.published
  })));

  return {
    selectedWeek,
    selectedYear,
    weekDates,
    weekAssignments,
    assignments,
    loading,
    error,
    operationStates,
    isDialogOpen,
    setIsDialogOpen,
    currentAssignment,
    selectedDay,
    formData,
    setFormData,
    handlePreviousWeek: () => {
      const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
      setSelectedWeek(week);
      setSelectedYear(year);
    },
    handleNextWeek: () => {
      const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
      setSelectedWeek(week);
      setSelectedYear(year);
    },
    handleOpenCreateDialog: (date: string) => {
      setCurrentAssignment(null);
      const taskDate = date && date.trim() !== '' ? date : getFreshToday();
      setSelectedDay(taskDate);
      setFormData({
        title: '',
        description: '',
        date: taskDate,
        fromTime: '08:00',
        toTime: '16:00',
        location: '',
        car: '',
        employees: [],
        published: false
      });
      setIsDialogOpen(true);
    },
    handleOpenEditDialog: (assignment: Assignment) => {
      console.log(`[usePlannerPage] PUBLISHED FIX - Opening edit dialog for assignment:`, {
        id: assignment.id,
        title: assignment.title,
        published: assignment.published
      });
      
      setCurrentAssignment(assignment);
      setSelectedDay(assignment.date);
      setFormData({
        ...assignment,
        employees: Array.isArray(assignment.employees) ? [...assignment.employees] : [],
        car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : '',
        published: assignment.published
      });
      setIsDialogOpen(true);
    },
    handleSubmit: async (data: Partial<Assignment>) => {
      console.log('[usePlannerPage] EDIT FIX - Form submission data:', data);
      console.log('[usePlannerPage] EDIT FIX - Current assignment:', currentAssignment?.id);
      
      try {
        if (currentAssignment?.id) {
          const updateData = {
            ...data,
            published: currentAssignment.published
          };
          
          console.log('[usePlannerPage] PUBLISHED FIX - Updating assignment with preserved published status:', {
            id: currentAssignment.id,
            originalPublished: currentAssignment.published,
            updatePublished: updateData.published
          });
          
          await updateAssignment(currentAssignment.id, updateData);
        } else {
          console.log('[usePlannerPage] EDIT FIX - Creating new assignment');
          await createAssignment(data);
        }
        
        console.log('[usePlannerPage] EDIT FIX - Operation completed successfully');
      } catch (error) {
        console.error('[usePlannerPage] EDIT FIX - Operation failed:', error);
      }
    },
    handlePublishDay: (date: string) => {
      console.log('[usePlannerPage] Publishing day:', date);
    },
    handlePublishAllUnpublished: () => {
      toast({
        title: t('common.info'),
        description: 'Publish all unpublished functionality not yet implemented'
      });
    },
    deleteAssignment: async (id: string) => {
      console.log('[usePlannerPage] EDIT FIX - Deleting assignment:', id);
      await deleteAssignmentAction(id);
    },
    publishAssignment: async (id: string) => {
      console.log('[usePlannerPage] EDIT FIX - Publishing assignment:', id);
      await publishAssignmentFromHook(id);
    },
    handleCopyAssignment: (assignment: Assignment) => {
      setCurrentAssignment(null);
      const freshTodayDate = getFreshToday();
      setSelectedDay(freshTodayDate);
      setFormData({
        ...assignment,
        id: undefined,
        date: freshTodayDate,
        published: false,
        employees: Array.isArray(assignment.employees) ? [...assignment.employees] : [],
        car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : ''
      });
      setIsDialogOpen(true);
    }
  };
};
