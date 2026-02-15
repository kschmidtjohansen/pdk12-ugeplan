
import { useState, useCallback, useEffect } from 'react';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Car } from '@/types/car';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

export interface AssignmentFormData {
  date: string;
  dates?: string[];
  title?: string;
  description?: string;
  fromTime?: string;
  toTime?: string;
  location?: string;
  car?: string;
  cars?: string[];
  employees?: string[];
  responsibleUserId?: string;
}

export const useAssignmentFormState = (
  employees: Employee[],
  cars: Car[],
  assignments: Assignment[],
  fetchAssignments: () => void,
  currentAssignment: Assignment | null,
  setCurrentAssignment: (assignment: Assignment | null) => void,
  setDialogOpen: (open: boolean) => void,
  selectedDate: string
) => {
  const { user, isDemoMode } = useAuth();
  
  const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');
  const initialDate = selectedDate && selectedDate.trim() !== '' ? selectedDate : getTodayDate();
  
  const getDefaultResponsibleUser = () => {
    if (isDemoMode && user) {
      if (import.meta.env.DEV) console.log('[useAssignmentFormState] Demo mode: defaulting responsible user to current user');
      return user.id;
    }
    return '';
  };
  
  if (import.meta.env.DEV) {
    console.log('[useAssignmentFormState] Initializing with date:', initialDate);
  }

  const [formData, setFormData] = useState<AssignmentFormData>({
    date: initialDate,
    dates: [initialDate],
    title: '',
    description: '',
    fromTime: '08:00',
    toTime: '16:00',
    location: '',
    car: '',
    cars: [],
    employees: [],
    responsibleUserId: getDefaultResponsibleUser()
  });

  useEffect(() => {
    if (selectedDate && selectedDate.trim() !== '') {
      if (import.meta.env.DEV) console.log('[useAssignmentFormState] Selected date changed:', selectedDate);
      setFormData(prev => ({
        ...prev,
        date: selectedDate,
        dates: [selectedDate]
      }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isDemoMode && user && !currentAssignment) {
      if (import.meta.env.DEV) console.log('[useAssignmentFormState] Setting default responsible user for demo mode');
      setFormData(prev => ({
        ...prev,
        responsibleUserId: user.id
      }));
    }
  }, [isDemoMode, user, currentAssignment]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleEmployeeToggle = useCallback((employeeId: string) => {
    if (import.meta.env.DEV) console.log('[useAssignmentFormState] Employee toggled:', employeeId);
    
    if (!employeeId || employeeId.trim() === '') {
      if (import.meta.env.DEV) console.warn('[useAssignmentFormState] Invalid employee ID provided');
      return;
    }

    setFormData(prev => {
      const currentEmployees = prev.employees || [];
      let newEmployees;
      
      if (currentEmployees.includes(employeeId)) {
        newEmployees = currentEmployees.filter(id => id !== employeeId);
      } else {
        newEmployees = [...currentEmployees, employeeId];
      }
      
      if (import.meta.env.DEV) console.log('[useAssignmentFormState] New employees array:', newEmployees);
      
      return {
        ...prev,
        employees: newEmployees
      };
    });
  }, [formData.employees]);

  const handleCarChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      car: value
    }));
  }, []);

  const handleCarsChange = useCallback((carIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      cars: carIds
    }));
  }, []);

  const handleResponsibleUserChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      responsibleUserId: value
    }));
  }, []);

  const resetForm = useCallback(() => {
    if (import.meta.env.DEV) console.log('[useAssignmentFormState] Resetting form data');
    const todayDate = format(new Date(), 'yyyy-MM-dd');
    setFormData({
      date: todayDate,
      dates: [todayDate],
      title: '',
      description: '',
      fromTime: '08:00',
      toTime: '16:00',
      location: '',
      car: '',
      cars: [],
      employees: [],
      responsibleUserId: getDefaultResponsibleUser()
    });
  }, [isDemoMode, user]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedAssignment: Partial<Assignment> = {
      ...formData,
      id: currentAssignment?.id,
      published: currentAssignment?.published || false
    };
    
    if (import.meta.env.DEV) {
      if (currentAssignment) {
        console.log("Updating assignment:", updatedAssignment);
      } else {
        console.log("Creating new assignment:", updatedAssignment);
      }
    }
    
    setDialogOpen(false);
    fetchAssignments();
  }, [formData, currentAssignment, setDialogOpen, fetchAssignments]);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleEmployeeToggle,
    handleCarChange,
    handleCarsChange,
    handleResponsibleUserChange,
    handleSubmit,
    resetForm
  };
};