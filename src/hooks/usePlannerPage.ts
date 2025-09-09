import React, { useState, useCallback } from 'react';
// NOTICE: This file (usePlannerPage.ts) is 201 lines long and should be refactored into smaller hooks.
import { format } from 'date-fns';
import { Assignment } from '../types/assignment';
import { useOptimizedAssignments } from './useOptimizedAssignments';
import { 
  getWeekDates, 
  getCurrentWeekInfo, 
  getPreviousWeekInfo, 
  getNextWeekInfo,
  getWeekNumber,
  getYearForDate
} from '@/utils/dates';
import { useToast } from '@/hooks/use-toast';
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
  
  // SERVICEMEDARBEJDER FIX: All users can now see all assignments due to updated RLS policy
  const isAdminOrSkadeleder = user?.role === 'administrator' || user?.role === 'skadeleder';
  const plannerFilter = 'all'; // All users including servicemedarbejder can see all assignments
  
  console.log(`[usePlannerPage] SERVICEMEDARBEJDER FIX - User: ${user?.name} (${user?.role}), Filter: ${plannerFilter}`);
  
  // Use the unified optimized assignments hook for all operations
  const { 
    assignments, 
    loading,
    error,
    operationStates,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate
  } = useOptimizedAssignments('all');

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
  
  // SERVICEMEDARBEJDER FIX: Filter assignments by week only - RLS handles access control
  const weekAssignments = React.useMemo(() => {
    console.log(`[usePlannerPage] SERVICEMEDARBEJDER FIX - Filtering ${assignments.length} assignments for week ${selectedWeek}/${selectedYear}`);
    
    let filteredAssignments = assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentWeek = getWeekNumber(assignmentDate);
      const assignmentYear = getYearForDate(assignmentDate);
      
      return assignmentWeek === selectedWeek && assignmentYear === selectedYear;
    });

    // RLS policies now handle access control - servicemedarbejder can see all assignments
    
    console.log(`[usePlannerPage] SERVICEMEDARBEJDER FIX - Week filtered results: ${filteredAssignments.length} assignments`);
    console.log(`[usePlannerPage] SERVICEMEDARBEJDER FIX - All assignments with details:`, 
      filteredAssignments.map(a => ({ 
        title: a.title, 
        responsibleUser: a.responsibleUser?.name,
        employees: a.assignedEmployees?.map(e => e.name) || a.employees,
        cars: a.cars
      })));
    
    return filteredAssignments;
  }, [assignments, selectedWeek, selectedYear]);

  // FIXED: Add proper employee toggle handler
  const handleEmployeeToggle = useCallback((employeeId: string) => {
    console.log('[usePlannerPage] Employee toggled:', employeeId);
    console.log('[usePlannerPage] Current employees:', formData.employees);
    
    setFormData(prevFormData => {
      const currentEmployees = prevFormData.employees || [];
      const isSelected = currentEmployees.includes(employeeId);
      
      let updatedEmployees: string[];
      if (isSelected) {
        updatedEmployees = currentEmployees.filter(id => id !== employeeId);
        console.log('[usePlannerPage] Removing employee:', employeeId);
      } else {
        updatedEmployees = [...currentEmployees, employeeId];
        console.log('[usePlannerPage] Adding employee:', employeeId);
      }
      
      console.log('[usePlannerPage] Updated employees:', updatedEmployees);
      return {
        ...prevFormData,
        employees: updatedEmployees
      };
    });
  }, [formData.employees]);

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
    handleEmployeeToggle,
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
        console.log('[usePlannerPage] === SUBMIT HANDLER START ===');
        console.log('[usePlannerPage] Submitting data:', data);
        console.log('[usePlannerPage] Current assignment:', currentAssignment?.id);
        
        let success = false;
        if (currentAssignment?.id) {
          const updateData = {
            ...data,
            published: currentAssignment.published
          };
          console.log('[usePlannerPage] Updating assignment with data:', updateData);
          await updateAssignment(currentAssignment.id, updateData);
          success = true;
        } else {
          console.log('[usePlannerPage] Creating new assignment with data:', data);
          await createAssignment(data);
          success = true;
        }
        
        // FIXED: Close dialog only after successful operation
        if (success) {
          console.log('[usePlannerPage] Operation successful, closing dialog');
          setIsDialogOpen(false);
        }
        
        console.log('[usePlannerPage] === SUBMIT HANDLER END ===');
      } catch (error) {
        console.error('[usePlannerPage] Operation failed:', error);
        // Keep dialog open on error so user can retry
      }
    },
    handlePublishDay: async (date: string) => {
      await publishAssignmentsByDate(date);
    },
    handlePublishAllUnpublished: async () => {
      await publishAssignmentsByDate(getFreshToday());
    },
    deleteAssignment: async (id: string) => {
      await deleteAssignment(id);
    },
    publishAssignment: async (id: string) => {
      await publishAssignment(id);
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
