
import { useState, useCallback, useEffect } from 'react';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Car } from '@/types/car';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

export interface AssignmentFormData {
  date: string;
  title?: string;
  description?: string;
  fromTime?: string;
  toTime?: string;
  location?: string;
  car?: string;
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
  
  // Always calculate a fresh today's date when the hook is initialized
  const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');
  const initialDate = selectedDate && selectedDate.trim() !== '' ? selectedDate : getTodayDate();
  
  // Default responsible user - for demo mode, always default to current user
  const getDefaultResponsibleUser = () => {
    if (isDemoMode && user) {
      console.log('[useAssignmentFormState] Demo mode: defaulting responsible user to current user:', user.id);
      return user.id;
    }
    return '';
  };
  
  console.log('[useAssignmentFormState] Initializing with date:', initialDate);
  console.log('[useAssignmentFormState] Today fresh date:', getTodayDate());
  console.log('[useAssignmentFormState] Selected date provided:', selectedDate);

  const [formData, setFormData] = useState<AssignmentFormData>({
    date: initialDate,
    title: '',
    description: '',
    fromTime: '08:00',
    toTime: '16:00',
    location: '',
    car: '',
    employees: [],
    responsibleUserId: getDefaultResponsibleUser()
  });

  // Update form date if selectedDate changes
  useEffect(() => {
    if (selectedDate && selectedDate.trim() !== '') {
      console.log('[useAssignmentFormState] Selected date changed, updating form date:', selectedDate);
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
    }
  }, [selectedDate]);

  // Set default responsible user for demo mode when user is available
  useEffect(() => {
    if (isDemoMode && user && !currentAssignment) {
      console.log('[useAssignmentFormState] Setting default responsible user for demo mode:', user.id);
      setFormData(prev => ({
        ...prev,
        responsibleUserId: user.id
      }));
    }
  }, [isDemoMode, user, currentAssignment]);

  // Handle input changes for text fields
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle employee toggle (add/remove from array)
  const handleEmployeeToggle = useCallback((employeeId: string) => {
    console.log('[useAssignmentFormState] Employee toggled:', employeeId);
    console.log('[useAssignmentFormState] Current employees:', formData.employees);
    
    if (!employeeId || employeeId.trim() === '') {
      console.warn('[useAssignmentFormState] Invalid employee ID provided');
      return;
    }

    setFormData(prev => {
      const currentEmployees = prev.employees || [];
      let newEmployees;
      
      if (currentEmployees.includes(employeeId)) {
        newEmployees = currentEmployees.filter(id => id !== employeeId);
        console.log('[useAssignmentFormState] Removing employee:', employeeId);
      } else {
        newEmployees = [...currentEmployees, employeeId];
        console.log('[useAssignmentFormState] Adding employee:', employeeId);
      }
      
      console.log('[useAssignmentFormState] New employees array:', newEmployees);
      
      return {
        ...prev,
        employees: newEmployees
      };
    });
  }, [formData.employees]);

  // Handle car selection
  const handleCarChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      car: value
    }));
  }, []);

  // Handle responsible user selection
  const handleResponsibleUserChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      responsibleUserId: value
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedAssignment: Partial<Assignment> = {
      ...formData,
      id: currentAssignment?.id,
      published: currentAssignment?.published || false
    };
    
    if (currentAssignment) {
      // We're updating an existing assignment
      console.log("Updating assignment:", updatedAssignment);
    } else {
      // We're creating a new assignment
      console.log("Creating new assignment:", updatedAssignment);
    }
    
    // Close the dialog and refresh assignments
    setDialogOpen(false);
    fetchAssignments();
  }, [formData, currentAssignment, setDialogOpen, fetchAssignments]);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleEmployeeToggle,
    handleCarChange,
    handleResponsibleUserChange,
    handleSubmit
  };
};
