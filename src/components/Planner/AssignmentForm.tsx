
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Assignment } from '@/types/assignment';
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
  selectedDay: string;
  onPublishDay: (date: string) => void; // FIXED: Updated to accept date parameter
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  currentAssignment,
  formData,
  setFormData,
  onSubmit,
  onDelete,
  onPublish,
  assignments,
  selectedDay,
  onPublishDay
}) => {
  const { t } = useTranslation();
  const { canEdit, canPublishTasks } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<Partial<Assignment>>({
    defaultValues: formData
  });

  // Update form when formData changes
  useEffect(() => {
    if (formData) {
      Object.entries(formData).forEach(([key, value]) => {
        setValue(key as keyof Assignment, value);
      });
    }
  }, [formData, setValue]);

  const handleFormSubmit = async (data: Partial<Assignment>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    if (currentAssignment?.id) {
      onDelete(currentAssignment.id);
    }
  };

  const handlePublishClick = () => {
    if (currentAssignment?.id) {
      onPublish(currentAssignment.id);
    }
  };

  const handlePublishDayClick = () => {
    if (selectedDay) {
      onPublishDay(selectedDay);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {currentAssignment ? t('planner.editAssignment') : t('planner.createNew')}
        </h2>
        
        <AssignmentFormFields
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          formData={formData}
          setFormData={setFormData}
          assignments={assignments}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          <Edit3 className="mr-2 h-4 w-4" />
          {currentAssignment ? t('common.update') : t('common.create')}
        </Button>

        {currentAssignment && canEdit && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteClick}
            className="flex-1"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        )}

        {currentAssignment && canPublishTasks && !currentAssignment.published && (
          <Button
            type="button"
            onClick={handlePublishClick}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Send className="mr-2 h-4 w-4" />
            {t('planner.publishAssignment')}
          </Button>
        )}

        {canPublishTasks && (
          <Button
            type="button"
            onClick={handlePublishDayClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="mr-2 h-4 w-4" />
            {t('planner.publishDayTasks')}
          </Button>
        )}
      </div>
    </form>
  );
};

export default AssignmentForm;
