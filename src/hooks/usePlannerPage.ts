import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Assignment } from '../types/assignment';
import { useOptimizedAssignments } from './useOptimizedAssignments';
import { useAssignmentActions } from './assignment/useAssignmentActions';
import { 
  getWeekDates, 
  getCurrentWeekInfo, 
  getPreviousWeekInfo, 
  getNextWeekInfo,
  getWeekNumber,
  getYearForDate
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
  
  // CRITICAL FIX: Improved role-based filtering
  const isAdminOrSkadeleder = user?.role === 'administrator' || user?.role === 'skadeleder';
  const isServicemedarbejder = user?.role === 'servicemedarbejder';
  
  // CRITICAL FIX: Use 'published' for servicemedarbejder to get only their assigned tasks
  const plannerFilter = isAdminOrSkadeleder ? 'all' : 'published';
  
  console.log(`[usePlannerPage] User: ${user?.name} (${user?.role})`);
  console.log(`[usePlannerPage] Using filter: ${plannerFilter} (admin/skadeleder: ${isAdminOrSkadeleder}, servicemedarbejder: ${isServicemedarbejder})`);
  
  const { 
    assignments, 
    loading,
    error,
    operationStates,
    refetch,
    deleteAssignment: deleteAssignmentFromHook,
    publishAssignment: publishAssignmentFromHook
  } = useOptimizedAssignments(plannerFilter);

  // DEBUG: Log raw planner data
  console.log('Planner raw assignments:', JSON.stringify(assignments.slice(0, 3), null, 2));

  const {
    createAssignment,
    updateAssignment,
    deleteAssignment: deleteAssignmentAction,
    publishAssignment: publishAssignmentAction,
    publishAssignmentsByDate: publishAssignmentsByDateAction
  } = useAssignmentActions(refetch, setIsDialogOpen);

  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const { filterByWeek } = useAssignmentFilters();

  console.log(`[usePlannerPage] Received ${assignments.length} assignments for planner display`);
  
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
  
  // CRITICAL FIX: Simplified week filtering - assignments are already user-filtered at service level
  const weekAssignments = React.useMemo(() => {
    console.log(`[usePlannerPage] Starting week filter for week ${selectedWeek}/${selectedYear}`);
    console.log(`[usePlannerPage] Input assignments:`, assignments.length, 'for user role:', user?.role);
    
    // For all users, just filter by week - user-specific filtering is now handled in the service
    const filtered = assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentWeek = getWeekNumber(assignmentDate);
      const assignmentYear = getYearForDate(assignmentDate);
      
      const isInWeek = assignmentWeek === selectedWeek && assignmentYear === selectedYear;
      
      console.log(`[usePlannerPage] Assignment "${assignment.title}":`, {
        date: assignment.date,
        week: assignmentWeek,
        year: assignmentYear,
        isInWeek,
        employees: assignment.employees,
        userRole: user?.role
      });
      
      return isInWeek;
    });
    
    console.log(`[usePlannerPage] Week filtered results:`, {
      totalFiltered: filtered.length,
      userRole: user?.role,
      week: selectedWeek,
      year: selectedYear
    });

    // DEBUG: Log filtered planner data
    console.log('Planner filtered assignments:', JSON.stringify(filtered.slice(0, 3), null, 2));
    
    return filtered;
  }, [assignments, selectedWeek, selectedYear, user?.role, user?.name]);

  console.log(`[usePlannerPage] Final week assignments for display:`, {
    count: weekAssignments.length,
    userRole: user?.role,
    week: selectedWeek,
    year: selectedYear
  });

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
      console.log(`[usePlannerPage] Opening edit dialog for assignment:`, {
        id: assignment.id,
        title: assignment.title,
        published: assignment.published,
        responsibleUser: assignment.responsibleUser,
        employees: assignment.employees,
        cars: assignment.cars
      });
      
      setCurrentAssignment(assignment);
      setSelectedDay(assignment.date);
      setFormData({
        ...assignment,
        employees: assignment.employees ? [...assignment.employees] : [],
        car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : '',
        published: assignment.published
      });
      setIsDialogOpen(true);
    },
    handleSubmit: async (data: Partial<Assignment>) => {
      console.log('[usePlannerPage] Form submission data:', data);
      console.log('[usePlannerPage] Current assignment:', currentAssignment?.id);
      
      try {
        if (currentAssignment?.id) {
          const updateData = {
            ...data,
            published: currentAssignment.published
          };
          
          console.log('[usePlannerPage] Updating assignment with preserved published status:', {
            id: currentAssignment.id,
            originalPublished: currentAssignment.published,
            updatePublished: updateData.published
          });
          
          await updateAssignment(currentAssignment.id, updateData);
        } else {
          console.log('[usePlannerPage] Creating new assignment');
          await createAssignment(data);
        }
        
        console.log('[usePlannerPage] Operation completed successfully');
      } catch (error) {
        console.error('[usePlannerPage] Operation failed:', error);
      }
    },
    handlePublishDay: async (date: string) => {
      console.log('[usePlannerPage] Publishing day:', date);
      await publishAssignmentsByDateAction(date);
    },
    handlePublishAllUnpublished: async () => {
      console.log('[usePlannerPage] Publishing all unpublished assignments');
      await publishAssignmentsByDate(getFreshToday());
    },
    deleteAssignment: async (id: string) => {
      console.log('[usePlannerPage] Deleting assignment:', id);
      await deleteAssignmentAction(id);
    },
    publishAssignment: async (id: string) => {
      console.log('[usePlannerPage] Publishing assignment:', id);
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
        employees: assignment.employees ? [...assignment.employees] : [],
        car: assignment.car ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.id) : ''
      });
      setIsDialogOpen(true);
    }
  };
};
