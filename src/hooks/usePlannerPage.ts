import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Assignment } from '../types/assignment';
import { useAssignmentDataOptimized } from './assignment/useAssignmentDataOptimized';
import { useAssignmentActions } from './assignment/useAssignmentActions';
import { 
  getWeekDates, 
  getCurrentWeekInfo, 
  getPreviousWeekInfo, 
  getNextWeekInfo,
  getWeekNumber,
  getYearForDate
} from '@/utils/dates';
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
  
  // Role-based filtering - servicemedarbejder users can now see all published assignments
  const isAdminOrSkadeleder = user?.role === 'administrator' || user?.role === 'skadeleder';
  const plannerFilter = 'all'; // All users can see published assignments due to updated RLS policy
  
  console.log(`[usePlannerPage] User: ${user?.name} (${user?.role}), Filter: ${plannerFilter}`);
  
  // CRITICAL FIX: Use the optimized hook that properly fetches responsible user data
  const { 
    assignments, 
    loading,
    error,
    fetchAssignments
  } = useAssignmentDataOptimized();

  const {
    createAssignment,
    updateAssignment,
    deleteAssignment: deleteAssignmentAction,
    publishAssignment: publishAssignmentAction,
    publishAssignmentsByDate: publishAssignmentsByDateAction
  } = useAssignmentActions(fetchAssignments, setIsDialogOpen);

  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  
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
  
  // Filter assignments by week and apply role-based filtering
  const weekAssignments = React.useMemo(() => {
    console.log(`[usePlannerPage] SAGSANSVARLIG FIX - Filtering ${assignments.length} assignments for week ${selectedWeek}/${selectedYear}`);
    
    let filteredAssignments = assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentWeek = getWeekNumber(assignmentDate);
      const assignmentYear = getYearForDate(assignmentDate);
      
      return assignmentWeek === selectedWeek && assignmentYear === selectedYear;
    });

    // RLS policies now handle access control, no additional filtering needed
    
    console.log(`[usePlannerPage] SAGSANSVARLIG FIX - Week filtered results: ${filteredAssignments.length} assignments`);
    console.log(`[usePlannerPage] SAGSANSVARLIG FIX - Assignments with responsible users:`, 
      filteredAssignments.filter(a => a.responsibleUser).map(a => ({ 
        title: a.title, 
        responsibleUser: a.responsibleUser?.name 
      })));
    
    return filteredAssignments;
  }, [assignments, selectedWeek, selectedYear, isAdminOrSkadeleder]);

  return {
    selectedWeek,
    selectedYear,
    weekDates,
    weekAssignments,
    assignments,
    loading,
    error,
    operationStates: {}, // Simplified for now
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
      console.log(`[usePlannerPage] Opening edit dialog for assignment:`, assignment.title);
      
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
      try {
        if (currentAssignment?.id) {
          const updateData = {
            ...data,
            published: currentAssignment.published
          };
          await updateAssignment(currentAssignment.id, updateData);
        } else {
          await createAssignment(data);
        }
      } catch (error) {
        console.error('[usePlannerPage] Operation failed:', error);
      }
    },
    handlePublishDay: async (date: string) => {
      await publishAssignmentsByDateAction(date);
    },
    handlePublishAllUnpublished: async () => {
      await publishAssignmentsByDateAction(getFreshToday());
    },
    deleteAssignment: async (id: string) => {
      await deleteAssignmentAction(id);
    },
    publishAssignment: async (id: string) => {
      await publishAssignmentAction(id);
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
