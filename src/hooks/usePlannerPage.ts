
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
  
  // CRITICAL FIX: Use 'published' for servicemedarbejder to see ALL published tasks
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
    deleteAssignment: deleteAssignmentAction
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
  
  // CRITICAL FIX: Completely rewritten week filtering for servicemedarbejder
  const weekAssignments = React.useMemo(() => {
    console.log(`[usePlannerPage] Starting week filter for week ${selectedWeek}/${selectedYear}`);
    console.log(`[usePlannerPage] Input assignments:`, assignments.length, 'for user role:', user?.role);
    
    if (isServicemedarbejder) {
      // CRITICAL FIX: For servicemedarbejder, ALL assignments are already published (due to 'published' filter)
      // So we only need to filter by week, NOT by user assignment
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
          shouldShow: isInWeek,
          employees: assignment.employees,
          CRITICAL: 'Should show ALL published assignments regardless of user assignment'
        });
        
        return isInWeek;
      });
      
      console.log(`[usePlannerPage] Servicemedarbejder filtered results:`, {
        totalFiltered: filtered.length,
        includesTasksNotAssignedToUser: filtered.filter(a => !a.employees?.includes(user?.name || '')).length,
        includesTasksAssignedToUser: filtered.filter(a => a.employees?.includes(user?.name || '')).length,
        allTaskTitles: filtered.map(a => a.title),
        CRITICAL: 'All published assignments in week should be visible'
      });

      // DEBUG: Log filtered planner data
      console.log('Planner filtered assignments:', JSON.stringify(filtered.slice(0, 3), null, 2));
      
      return filtered;
    } else {
      // For admin/skadeleder, use existing filterByWeek logic
      const filtered = filterByWeek(assignments, selectedWeek, selectedYear);
      console.log(`[usePlannerPage] Admin/Skadeleder filtered results:`, filtered.length);
      
      // DEBUG: Log filtered planner data
      console.log('Planner filtered assignments:', JSON.stringify(filtered.slice(0, 3), null, 2));
      
      return filtered;
    }
  }, [assignments, selectedWeek, selectedYear, isServicemedarbejder, user?.name, filterByWeek]);

  console.log(`[usePlannerPage] Final week assignments for display:`, {
    count: weekAssignments.length,
    userRole: user?.role,
    week: selectedWeek,
    year: selectedYear,
    shouldShowAllPublished: isServicemedarbejder,
    CRITICAL: 'Final assignments ready for planner display'
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
    handlePublishDay: (date: string) => {
      console.log('[usePlannerPage] Publishing day:', date);
    },
    handlePublishAllUnpublished: () => {
      toast({
        title: t('common.info'),
        description: t('dashboard.functionalityNotImplemented')
      });
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
