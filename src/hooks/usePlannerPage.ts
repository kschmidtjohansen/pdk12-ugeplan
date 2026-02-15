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
  
  const isAdminOrSkadeleder = user?.role === 'administrator' || user?.role === 'skadeleder';
  const plannerFilter = 'all';
  
  if (import.meta.env.DEV) console.log(`[usePlannerPage] User: ${user?.name} (${user?.role}), Filter: ${plannerFilter}`);
  
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
  
  const weekAssignments = React.useMemo(() => {
    let filteredAssignments = assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const assignmentWeek = getWeekNumber(assignmentDate);
      const assignmentYear = getYearForDate(assignmentDate);
      
      return assignmentWeek === selectedWeek && assignmentYear === selectedYear;
    });

    if (import.meta.env.DEV) console.log(`[usePlannerPage] Week ${selectedWeek}/${selectedYear}: ${filteredAssignments.length} assignments`);
    
    return filteredAssignments;
  }, [assignments, selectedWeek, selectedYear]);

  const handleEmployeeToggle = useCallback((employeeId: string) => {
    if (import.meta.env.DEV) console.log('[usePlannerPage] Employee toggled:', employeeId);
    
    setFormData(prevFormData => {
      const currentEmployees = prevFormData.employees || [];
      const isSelected = currentEmployees.includes(employeeId);
      
      const updatedEmployees = isSelected
        ? currentEmployees.filter(id => id !== employeeId)
        : [...currentEmployees, employeeId];
      
      return { ...prevFormData, employees: updatedEmployees };
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
      if (import.meta.env.DEV) console.log(`[usePlannerPage] Opening edit dialog for:`, assignment.title);
      
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
        if (import.meta.env.DEV) console.log('[usePlannerPage] Submit:', currentAssignment?.id ? 'update' : 'create');
        
        let success = false;
        if (currentAssignment?.id) {
          await updateAssignment(currentAssignment.id, { ...data, published: currentAssignment.published });
          success = true;
        } else {
          await createAssignment(data);
          success = true;
        }
        
        if (success) {
          setIsDialogOpen(false);
        }
      } catch (error) {
        console.error('[usePlannerPage] Operation failed:', error);
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
