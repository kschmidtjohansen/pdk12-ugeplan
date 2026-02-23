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
  onEmployeeToggle: (employeeId: string) => void;
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
  onPublishDay,
  onEmployeeToggle
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
  const [zipCode, setZipCode] = useState(formData.zip_code || '');
  const [city, setCity] = useState(formData.city || '');
  const [assignmentLat, setAssignmentLat] = useState<number | undefined>(formData.lat ?? undefined);
  const [assignmentLng, setAssignmentLng] = useState<number | undefined>(formData.lng ?? undefined);
  const {
    handleSubmit,
    formState: {
      errors
    }
  } = useForm<Partial<Assignment>>({
    defaultValues: formData
  });

  // Handle form submission with comprehensive validation
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (import.meta.env.DEV) {
      console.log('[AssignmentForm] === FORM SUBMISSION DEBUG ===');
      console.log('[AssignmentForm] Form data at submission:', formData);
    }

    // Enhanced validation with translated error messages
    const validationErrors: string[] = [];
    if (!formData.title?.trim()) {
      validationErrors.push(t('planner.validation.titleRequired'));
    }
    if (!formData.location?.trim()) {
      validationErrors.push(t('planner.validation.locationRequired'));
    }
    // FIX: Valider mod både formData.date OG dates-arrayet (multi-dag support)
    if (!formData.date && !((formData as any).dates?.length > 0)) {
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
      if (import.meta.env.DEV) console.error('[AssignmentForm] Validation failed:', validationErrors);
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
      if (import.meta.env.DEV) console.log('[AssignmentForm] Validation passed, calling onSubmit with data:', formData);
      await onSubmit({ ...formData, zip_code: zipCode, city, lat: assignmentLat, lng: assignmentLng });
      if (import.meta.env.DEV) console.log('[AssignmentForm] onSubmit completed successfully');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[AssignmentForm] Error in form submission:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteClick = () => {
    if (import.meta.env.DEV) console.log('[AssignmentForm] Delete clicked for assignment:', currentAssignment?.id);
    if (currentAssignment?.id) {
      onDelete(currentAssignment.id);
    }
  };
  const handlePublishClick = () => {
    if (import.meta.env.DEV) {
      console.log('[AssignmentForm] Publishing assignment:', currentAssignment?.id);
      console.log('[AssignmentForm] Current published status:', currentAssignment?.published);
    }
    if (currentAssignment?.id) {
      onPublish(currentAssignment.id);
    }
  };
  const handlePublishDayClick = () => {
    if (selectedDay) {
      onPublishDay(selectedDay);
    }
  };

  // Helper function to get car ID as string
  const getCarId = (car: string | { id: string; name: string } | null): string => {
    if (typeof car === 'string') return car;
    if (car && typeof car === 'object' && 'id' in car) return car.id;
    return '';
  };

  // Helper function to get responsible user ID as string
  const getResponsibleUserId = (user: { id: string; name: string } | null): string => {
    if (formData.responsibleUserId) return formData.responsibleUserId as string;
    if (user && typeof user === 'object' && 'id' in user) return user.id;
    return '';
  };

  // Helper function to set responsible user as object
  const setResponsibleUserById = (userId: string) => {
    if (userId) {
      const user = employees.find(emp => emp.id === userId);
      const userName = user ? user.name : '';
      setFormData({
        ...formData,
        responsibleUser: { id: userId, name: userName },
        responsibleUserId: userId
      });
    } else {
      setFormData({
        ...formData,
        responsibleUser: null,
        responsibleUserId: null
      });
    }
  };

  // Helper function to handle employees as array of strings
  const handleEmployeesChange = (employees: string[]) => {
    setFormData({ ...formData, employees });
  };

  // Helper function to update assignment's single car (backward compatibility)
  const handleCarChange = (carId: string) => {
    setFormData({ ...formData, car: carId === '' ? null : carId });
  };

  // Helper function to update assignment's multiple cars
  const handleCarsChange = (carIds: string[]) => {
    if (import.meta.env.DEV) console.log('[AssignmentForm] Cars changed to:', carIds);
    setFormData({
      ...formData,
      cars: carIds,
      car: carIds.length > 0 ? carIds[0] : ''
    });
  };

  // Handle multiple dates for create mode, single date for edit mode
  const handleDatesChange = (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const dateStrings = dates.map(date => format(date, 'yyyy-MM-dd'));
      if (import.meta.env.DEV) {
        console.log('[AssignmentForm] Dates changed:', dateStrings);
      }
      const updatedData = { ...formData, date: dateStrings[0] } as any;
      updatedData.dates = dateStrings;
      setFormData(updatedData);
    } else {
      const clearedData = { ...formData, date: '' } as any;
      clearedData.dates = [];
      setFormData(clearedData);
    }
  };

  // Check if we can publish this assignment
  const canPublishAssignment = currentAssignment && canPublishTasks && !currentAssignment.published;
  return <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {currentAssignment ? t('planner.editAssignment') : t('planner.createNew')}
        </h2>
        
        <AssignmentFormFields 
          title={formData.title || ''} 
          setTitle={value => {
            if (import.meta.env.DEV) console.log('[AssignmentForm] Title updated:', value);
            setFormData({
              ...formData,
              title: value
            });
          }} 
          location={formData.location || ''} 
          setLocation={value => {
            if (import.meta.env.DEV) console.log('[AssignmentForm] Location updated:', value);
            setFormData({
              ...formData,
              location: value
            });
          }} 
          selectedDates={(formData as any).dates?.map((d: string) => { const [y,m,day] = d.split('-').map(Number); return new Date(y, m-1, day); }) || (formData.date ? (() => { const [y,m,day] = formData.date!.split('-').map(Number); return [new Date(y, m-1, day)]; })() : [])} 
          setSelectedDates={handleDatesChange}
          isEditMode={!!currentAssignment}
          fromTime={formData.fromTime || '08:00'} 
          setFromTime={value => {
            if (import.meta.env.DEV) console.log('[AssignmentForm] From time updated:', value);
            setFormData({
              ...formData,
              fromTime: value
            });
          }} 
          toTime={formData.toTime || '16:00'} 
          setToTime={value => {
            if (import.meta.env.DEV) console.log('[AssignmentForm] To time updated:', value);
            setFormData({
              ...formData,
              toTime: value
            });
          }} 
          description={formData.description || ''} 
          setDescription={value => {
            if (import.meta.env.DEV) console.log('[AssignmentForm] Description updated:', value);
            setFormData({
              ...formData,
              description: value
            });
          }} 
          selectedCarIds={formData.cars || []} 
          setSelectedCarIds={handleCarsChange} 
          selectedResponsibleUserId={getResponsibleUserId(formData.responsibleUser)} 
          setSelectedResponsibleUserId={setResponsibleUserById} 
          selectedEmployees={normalizeEmployees(formData.employees)} 
          onEmployeeToggle={onEmployeeToggle} 
          cars={cars} 
          employees={employees} 
          vacations={vacations} 
          assignmentId={currentAssignment?.id} 
          assignments={assignments}
          zipCode={zipCode}
          setZipCode={setZipCode}
          city={city}
          setCity={setCity}
          onCoordsChange={(lat, lng) => {
            setAssignmentLat(lat);
            setAssignmentLng(lng);
          }}
          initialLat={formData.lat ?? undefined}
          initialLng={formData.lng ?? undefined}
        />
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