
import React from 'react';
import { Edit, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Assignment } from '../../types/assignment';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';

interface AssignmentActionButtonsProps {
  assignment: Assignment;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPublish?: () => void;
  size?: 'default' | 'sm' | 'lg' | 'xs';
}

const AssignmentActionButtons: React.FC<AssignmentActionButtonsProps> = ({
  assignment,
  canEdit,
  onEdit,
  onDelete,
  onPublish,
  size = 'sm'
}) => {
  const { canPublishTasks } = usePermissions();
  const { t } = useTranslation();
  const isPublished = assignment.published === true;
  
  if (!canEdit) return null;
  
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size={size} onClick={onEdit} className="h-8">
        <Edit className="h-4 w-4" />
      </Button>
      {canPublishTasks && !isPublished && onPublish && (
        <Button 
          variant="ghost" 
          size={size} 
          onClick={onPublish} 
          className="h-8"
          title={t('planner.publishAssignment')}
        >
          <Send className="h-4 w-4 text-polygon-blue" />
        </Button>
      )}
      <Button variant="ghost" size={size} onClick={onDelete} className="h-8">
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
};

export default AssignmentActionButtons;
