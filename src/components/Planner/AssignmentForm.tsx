import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Send, Trash2, Edit3 } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log('[AssignmentForm] Rendering with:', {
    currentAssignment: currentAssignment?.id,
    formDataDate: formData.date,
    selectedDay,
    formDataTitle: formData.title,
    formDataEmployees: formData.employees,
    formDataCar: formData.car,
    carType: typeof formData.car,
    isPublished: currentAssignment?.published
  });
  const {
    handleSubmit,
    formState: {
      errors
    }
  } = useForm<Partial<Assignment>>({
    defaultValues: formData
  });

  // Handle form submission with comprehensive debugging
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AssignmentForm] ===== FORM SUBMISSION START =====');
    console.log('[AssignmentForm] Current form data:', formData);
    console.log('[AssignmentForm] Is editing:', !!currentAssignment);
    console.log('[AssignmentForm] Assignment ID:', currentAssignment?.id);
    console.log('[AssignmentForm] Car data in form:', {
      car: formData.car,
      carType: typeof formData.car,
      isEmpty: !formData.car || formData.car === ''
    });

    // Validate required fields
    if (!formData.title || !formData.location || !formData.date) {
      console.error('[AssignmentForm] Validation failed - missing required fields');
      console.error('Title:', formData.title);
      console.error('Location:', formData.location);
      console.error('Date:', formData.date);
      return;
    }
    setIsSubmitting(true);
    try {
      console.log('[AssignmentForm] Calling onSubmit with data:', formData);
      await onSubmit(formData);
      console.log('[AssignmentForm] onSubmit completed successfully');
    } catch (error) {
      console.error('[AssignmentForm] Error in form submission:', error);
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
    if (user && typeof user === 'object' && 'id' in user) return user.id;
    return '';
  };

  // Helper function to set responsible user as object
  const setResponsibleUserById = (userId: string) => {
    console.log('[AssignmentForm] Setting responsible user ID:', userId);
    if (userId) {
      const updatedData = {
        ...formData,
        responsibleUser: {
          id: userId,
          name: ''
        }
      };
      console.log('[AssignmentForm] Updated form data with responsible user:', updatedData);
      setFormData(updatedData);
    } else {
      setFormData({
        ...formData,
        responsibleUser: null
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

    // Normalize the car value - empty string for no car, or the car ID
    const normalizedCar = carId === '' || !carId ? '' : carId;
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
      }} selectedDate={formData.date ? new Date(formData.date) : undefined} setSelectedDate={date => {
        const dateString = date ? date.toISOString().split('T')[0] : '';
        console.log('[AssignmentForm] Date updated:', dateString);
        setFormData({
          ...formData,
          date: dateString
        });
      }} fromTime={formData.fromTime || '08:00'} setFromTime={value => {
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
      }} selectedCarId={getCarId(formData.car)} setSelectedCarId={handleCarChange} selectedResponsibleUserId={getResponsibleUserId(formData.responsibleUser)} setSelectedResponsibleUserId={setResponsibleUserById} selectedEmployees={formData.employees || []} setSelectedEmployees={handleEmployeesChange} cars={cars} employees={employees} vacations={vacations} assignmentId={currentAssignment?.id} assignments={assignments} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          <Edit3 className="mr-2 h-4 w-4" />
          {isSubmitting ? t('common.saving') : currentAssignment ? t('common.update') : t('common.create')}
        </Button>

        {currentAssignment && canEdit}

        {canPublishAssignment && <Button type="button" onClick={handlePublishClick} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            <Send className="mr-2 h-4 w-4" />
            {t('planner.publishAssignment')}
          </Button>}

        {canPublishTasks && selectedDay}
      </div>
    </form>;
};
export default AssignmentForm;