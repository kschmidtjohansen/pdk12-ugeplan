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
  const { t } = useTranslation();
  const { canEdit, canPublishTasks } = usePermissions();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State management for all form fields
  const [title, setTitle] = useState(formData?.title || '');
  const [caseNumber, setCaseNumber] = useState(formData?.case_number || '');
  const [location, setLocation] = useState(formData?.location || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData?.date ? new Date(formData.date + 'T00:00:00') : undefined
  );
  const [fromTime, setFromTime] = useState(formData?.fromTime || '08:00');
  const [toTime, setToTime] = useState(formData?.toTime || '16:00');
  const [description, setDescription] = useState(formData?.description || '');
  const [selectedCarId, setSelectedCarId] = useState(formData?.car as string || '');
  const [selectedResponsibleUserId, setSelectedResponsibleUserId] = useState(formData?.responsibleUserId || '');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(
    normalizeEmployees(formData?.employees) || []
  );

  // Update state when formData changes
  useEffect(() => {
    if (formData) {
      setTitle(formData.title || '');
      setCaseNumber(formData.case_number || '');
      setLocation(formData.location || '');
      setSelectedDate(formData.date ? new Date(formData.date + 'T00:00:00') : undefined);
      setFromTime(formData.fromTime || '08:00');
      setToTime(formData.toTime || '16:00');
      setDescription(formData.description || '');
      setSelectedCarId(formData.car as string || '');
      setSelectedResponsibleUserId(formData.responsibleUserId || '');
      setSelectedEmployees(normalizeEmployees(formData.employees) || []);
    }
  }, [formData]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const validationErrors: string[] = [];
    if (!title.trim()) {
      validationErrors.push(t('planner.validation.titleRequired'));
    }
    if (!location.trim()) {
      validationErrors.push(t('planner.validation.locationRequired'));
    }
    if (!selectedDate) {
      validationErrors.push(t('planner.validation.dateRequired'));
    }
    if (!fromTime) {
      validationErrors.push(t('planner.validation.fromTimeRequired'));
    }
    if (!toTime) {
      validationErrors.push(t('planner.validation.toTimeRequired'));
    }
    if (fromTime && toTime && fromTime >= toTime) {
      validationErrors.push(t('planner.validation.timeOrderRequired'));
    }

    if (validationErrors.length > 0) {
      toast({
        title: t('common.validationError'),
        description: validationErrors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        title: title.trim(),
        case_number: caseNumber.trim() || undefined,
        location: location.trim(),
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        fromTime,
        toTime,
        description: description.trim(),
        car: selectedCarId || undefined,
        responsibleUserId: selectedResponsibleUserId || undefined,
        employees: selectedEmployees.length > 0 ? selectedEmployees : undefined,
        published: formData?.published || false
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error('[AssignmentForm] Submission error:', error);
      toast({
        title: t('common.error'),
        description: currentAssignment ? t('planner.errorUpdatingAssignment') : t('planner.errorCreatingAssignment'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (currentAssignment?.id) {
      await onDelete(currentAssignment.id);
    }
  };

  const handlePublishClick = async () => {
    if (currentAssignment?.id) {
      await onPublish(currentAssignment.id);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-6">
        <AssignmentFormFields
          title={title}
          setTitle={setTitle}
          caseNumber={caseNumber}
          setCaseNumber={setCaseNumber}
          location={location}
          setLocation={setLocation}
          selectedDate={selectedDate}
          setSelectedDate={handleDateChange}
          fromTime={fromTime}
          setFromTime={setFromTime}
          toTime={toTime}
          setToTime={setToTime}
          description={description}
          setDescription={setDescription}
          selectedCarId={selectedCarId}
          setSelectedCarId={setSelectedCarId}
          selectedResponsibleUserId={selectedResponsibleUserId}
          setSelectedResponsibleUserId={setSelectedResponsibleUserId}
          selectedEmployees={selectedEmployees}
          setSelectedEmployees={setSelectedEmployees}
          cars={cars}
          employees={employees}
          vacations={vacations}
          assignmentId={currentAssignment?.id}
          assignments={assignments}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center space-x-2">
          {currentAssignment && canEdit && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClick}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t('planner.deleteAssignment')}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {currentAssignment && !currentAssignment.published && canPublishTasks && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePublishClick}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{t('planner.publish')}</span>
            </Button>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2"
          >
            <Edit3 className="h-4 w-4" />
            <span>
              {currentAssignment 
                ? (isSubmitting ? t('planner.operations.updating') + '...' : t('planner.editAssignment'))
                : (isSubmitting ? t('planner.operations.creating') + '...' : t('planner.addAssignment'))
              }
            </span>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AssignmentForm;