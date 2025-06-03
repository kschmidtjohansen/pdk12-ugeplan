
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { 
  Edit3, 
  Trash2, 
  Eye, 
  Copy, 
  Monitor
} from 'lucide-react';

interface AssignmentActionButtonsProps {
  assignment: Assignment;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  onCopy: (assignment: Assignment) => void;
}

export const AssignmentActionButtons: React.FC<AssignmentActionButtonsProps> = ({
  assignment,
  onEdit,
  onDelete,
  onPublish,
  onCopy
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Only show action buttons for administrators and skadeledere
  const canPerformActions = user?.role === 'administrator' || user?.role === 'skadeleder';
  
  // Screen display button should be available for administrators and skadeledere
  const canShowOnScreen = user?.role === 'administrator' || user?.role === 'skadeleder';

  if (!canPerformActions) {
    return null;
  }

  const handleShowOnScreen = () => {
    const screenUrl = `/screen-display?date=${assignment.date}`;
    window.open(screenUrl, '_blank', 'fullscreen=yes');
  };

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(assignment)}
        className="h-7 w-7 p-0"
        title={t('planner.editAssignment')}
      >
        <Edit3 className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCopy(assignment)}
        className="h-7 w-7 p-0"
        title={t('planner.copyAssignment')}
      >
        <Copy className="h-3 w-3" />
      </Button>
      
      {!assignment.published && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPublish(assignment.id)}
          className="h-7 w-7 p-0"
          title={t('planner.publish')}
        >
          <Eye className="h-3 w-3" />
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShowOnScreen}
        className="h-7 w-7 p-0"
        title={t('planner.showOnScreen')}
      >
        <Monitor className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(assignment.id)}
        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
        title={t('planner.deleteAssignment')}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default AssignmentActionButtons;
