import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Assignment, normalizeEmployees } from '@/types/assignment';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Send, Trash2, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import AssignmentFormFields from './AssignmentFormFields';
interface AssignmentFormProps {
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  setFormData: (data: Partial<Assignment>) => void;
  onSubmit: (data: Partial<Assignment>) => void;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  assignments: Assignment[];
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  selectedDay: string;
  onPublishDay: (date: string) => void;
}
const AssignmentForm: React.FC<AssignmentFormProps> = ({
  currentAssignment,
  formData,
  setFormData,
  onSubmit,
  onDelete,
  onPublish,
  assignments,
  cars,
  employees,
  vacations,
  selectedDay,
  onPublishDay
}) => {
  const {
    t
  } = useTranslation();
  const {
    canEdit,
    canPublishTasks
  } = usePermissions();
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    handleSubmit,
    formState: {
      errors
    }
  } = useForm<Partial<Assignment>>({
    defaultValues: formData
  });

  // Handle form submission with comprehensive debugging and validation
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AssignmentForm] === FORM SUBMISSION DEBUG ===');
    console.log('[AssignmentForm] Form data at submission:', formData);

    // Enhanced validation with translated error messages
    const validationErrors: string[] = [];
    if (!formData.title?.trim()) {
      validationErrors.push(t('planner.validation.titleRequired'));
    }
    if (!formData.location?.trim()) {
      validationErrors.push(t('planner.validation.locationRequired'));
    }
    if (!formData.date) {
      validationErrors.push(t('planner.validation.dateRequired'));
    }
    if (!formData.fromTime) {
      validationErrors.push(t('planner.validation.fromTimeRequired'));
    }
    if (!formData.toTime) {
      validationErrors.push(t('planner.validation.toTimeRequired'));
    }

    // Validate time logic
    if (formData.fromTime && formData.toTime && formData.fromTime >= formData.toTime) {
      validationErrors.push(t('planner.validation.timeOrderRequired'));
    }
    if (validationErrors.length > 0) {
      console.error('[AssignmentForm] Validation failed:', validationErrors);
      // Show validation errors to user via toast
      validationErrors.forEach(error => {
        toast({
          title: t('common.error'),
          description: error,
          variant: 'destructive'
        });
      });
      return;
    }
    setIsSubmitting(true);
    try {
      console.log('[AssignmentForm] Validation passed, calling onSubmit with data:', formData);
      await onSubmit(formData);
      console.log('[AssignmentForm] onSubmit completed successfully');
    } catch (error) {
      console.error('[AssignmentForm] Error in form submission:', error);
      console.error('[AssignmentForm] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: typeof error,
        error
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteClick = () => {
    console.log('[AssignmentForm] Delete clicked for assignment:', currentAssignment?.id);
    if (currentAssignment?.id) {
      onDelete(currentAssignment.id);
    }
  };
  const handlePublishClick = () => {
    console.log('[AssignmentForm] ===== PUBLISH BUTTON CLICKED =====');
    console.log('[AssignmentForm] Publishing assignment:', currentAssignment?.id);
    console.log('[AssignmentForm] Current published status:', currentAssignment?.published);
    console.log('[AssignmentForm] Can publish tasks:', canPublishTasks);
    if (currentAssignment?.id) {
      console.log('[AssignmentForm] Calling onPublish function...');
      onPublish(currentAssignment.id);
    } else {
      console.error('[AssignmentForm] No assignment ID found for publishing');
    }
    console.log('[AssignmentForm] ===== PUBLISH BUTTON END =====');
  };
  const handlePublishDayClick = () => {
    console.log('[AssignmentForm] Publish day clicked for date:', selectedDay);
    if (selectedDay) {
      onPublishDay(selectedDay);
    }
  };

  // Helper function to get car ID as string
  const getCarId = (car: string | {
    id: string;
    name: string;
  } | null): string => {
    console.log('[AssignmentForm] Getting car ID from:', car, 'type:', typeof car);
    if (typeof car === 'string') return car;
    if (car && typeof car === 'object' && 'id' in car) return car.id;
    return '';
  };

  // Helper function to get responsible user ID as string
  const getResponsibleUserId = (user: {
    id: string;
    name: string;
  } | null): string => {
    // Prefer explicit responsibleUserId if present
    // Fallback to object-based user id
    if (formData.responsibleUserId) return formData.responsibleUserId as string;
    if (user && typeof user === 'object' && 'id' in user) return user.id;
    return '';
  };

  // Helper function to set responsible user as object
  const setResponsibleUserById = (userId: string) => {
    console.log('[AssignmentForm] Setting responsible user ID:', userId);
    if (userId) {
      // Find the user in employees to get their name
      const user = employees.find(emp => emp.id === userId);
      const userName = user ? user.name : '';
      console.log('[AssignmentForm] Found user for ID:', {
        userId,
        userName,
        user: user?.name
      });
      const updatedData = {
        ...formData,
        responsibleUser: {
          id: userId,
          name: userName
        },
        responsibleUserId: userId // FIX: Also set the responsibleUserId field
      };
      console.log('[AssignmentForm] Updated form data with responsible user:', updatedData);
      setFormData(updatedData);
    } else {
      console.log('[AssignmentForm] Clearing responsible user');
      setFormData({
        ...formData,
        responsibleUser: null,
        responsibleUserId: null // FIX: Use null instead of empty string
      });
    }
  };

  // Helper function to handle employees as array of strings
  const handleEmployeesChange = (employees: string[]) => {
    console.log('[AssignmentForm] Employees changed to:', employees);
    const updatedData = {
      ...formData,
      employees
    };
    console.log('[AssignmentForm] Updated form data with employees:', updatedData);
    setFormData(updatedData);
  };

  // Enhanced helper function to handle car selection with proper debugging
  const handleCarChange = (carId: string) => {
    console.log('[AssignmentForm] ===== CAR CHANGE =====');
    console.log('[AssignmentForm] Car change handler called:', {
      carId,
      carType: typeof carId,
      isEmpty: carId === '' || !carId,
      currentCar: formData.car
    });

    // Normalize the car value - null for no car, or the car ID
    const normalizedCar = carId === '' || !carId ? null : carId;
    const updatedData = {
      ...formData,
      car: normalizedCar
    };
    console.log('[AssignmentForm] Updated form data with car:', {
      updatedData,
      carValue: updatedData.car,
      carType: typeof updatedData.car,
      isEmpty: updatedData.car === '' || !updatedData.car
    });
    setFormData(updatedData);
    console.log('[AssignmentForm] ===== CAR CHANGE END =====');
  };

  // FIXED: Timezone-safe date handling to prevent date shifts
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Use date-fns format to ensure timezone-safe conversion
      const dateString = format(date, 'yyyy-MM-dd');
      console.log('[AssignmentForm] FIXED Date updated (timezone-safe):', dateString);
      console.log('[AssignmentForm] Original date object:', date);
      console.log('[AssignmentForm] Local date components:', {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      });
      setFormData({
        ...formData,
        date: dateString
      });
    } else {
      setFormData({
        ...formData,
        date: ''
      });
    }
  };

  // Check if we can publish this assignment
  const canPublishAssignment = currentAssignment && canPublishTasks && !currentAssignment.published;
  return <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {currentAssignment ? t('planner.editAssignment') : t('planner.createNew')}
        </h2>
        
        <AssignmentFormFields title={formData.title || ''} setTitle={value => {
        console.log('[AssignmentForm] Title updated:', value);
        setFormData({
          ...formData,
          title: value
        });
      }} location={formData.location || ''} setLocation={value => {
        console.log('[AssignmentForm] Location updated:', value);
        setFormData({
          ...formData,
          location: value
        });
      }} selectedDate={formData.date ? new Date(formData.date) : undefined} setSelectedDate={handleDateChange} fromTime={formData.fromTime || '08:00'} setFromTime={value => {
        console.log('[AssignmentForm] From time updated:', value);
        setFormData({
          ...formData,
          fromTime: value
        });
      }} toTime={formData.toTime || '16:00'} setToTime={value => {
        console.log('[AssignmentForm] To time updated:', value);
        setFormData({
          ...formData,
          toTime: value
        });
      }} description={formData.description || ''} setDescription={value => {
        console.log('[AssignmentForm] Description updated:', value);
        setFormData({
          ...formData,
          description: value
        });
      }} selectedCarId={getCarId(formData.car)} setSelectedCarId={handleCarChange} selectedResponsibleUserId={getResponsibleUserId(formData.responsibleUser)} setSelectedResponsibleUserId={setResponsibleUserById} selectedEmployees={normalizeEmployees(formData.employees)} setSelectedEmployees={handleEmployeesChange} cars={cars} employees={employees} vacations={vacations} assignmentId={currentAssignment?.id} assignments={assignments} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          <Edit3 className="mr-2 h-4 w-4" />
          {isSubmitting ? t('planner.operations.saving') : currentAssignment ? t('common.update') : t('common.create')}
        </Button>

        {currentAssignment && canEdit}

        {canPublishAssignment && <Button type="button" variant="secondary" onClick={handlePublishClick} className="flex-none">
            <Send className="mr-2 h-4 w-4" />
            {t('planner.publish')}
          </Button>}

        {canPublishTasks && selectedDay}
      </div>
    </form>;
};
export default AssignmentForm;