
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { Edit3, Trash2, Eye, Copy, Monitor } from 'lucide-react';

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

  // Screen display button should be available for administrators and skadeledere only
  const canShowOnScreen = user?.role === 'administrator' || user?.role === 'skadeleder';

  if (!canPerformActions) {
    return null;
  }

  const handleEditClick = () => {
    console.log('[AssignmentActionButtons] Edit button clicked for assignment:', assignment.id);
    console.log('[AssignmentActionButtons] Assignment data:', assignment);
    console.log('[AssignmentActionButtons] Calling onEdit function...');
    onEdit(assignment);
  };

  const handlePublishClick = () => {
    console.log('[AssignmentActionButtons] ===== PUBLISH ASSIGNMENT =====');
    console.log('[AssignmentActionButtons] Publish button clicked for assignment:', assignment.id);
    console.log('[AssignmentActionButtons] Assignment published status:', assignment.published);
    console.log('[AssignmentActionButtons] Calling onPublish function...');
    onPublish(assignment.id);
    console.log('[AssignmentActionButtons] ===== PUBLISH ASSIGNMENT END =====');
  };

  const handleShowOnScreen = () => {
    try {
      console.log('[AssignmentActionButtons] Opening screen display for date:', assignment.date);
      const screenUrl = `/screen-display?date=${assignment.date}`;
      window.open(screenUrl, '_blank', 'fullscreen=yes');
    } catch (error) {
      console.error('[AssignmentActionButtons] Error opening screen display:', error);
    }
  };

  const handleDeleteClick = () => {
    console.log('[AssignmentActionButtons] Delete button clicked for assignment:', assignment.id);
    onDelete(assignment.id);
  };

  const handleCopyClick = () => {
    console.log('[AssignmentActionButtons] Copy button clicked for assignment:', assignment.id);
    onCopy(assignment);
  };

  return (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleEditClick}
        className="h-7 w-7 p-0" 
        title={t('planner.editAssignment')}
      >
        <Edit3 className="h-3 w-3" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleCopyClick} 
        className="h-7 w-7 p-0" 
        title={t('planner.copyAssignment')}
      >
        <Copy className="h-3 w-3" />
      </Button>
      
      {!assignment.published && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handlePublishClick} 
          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" 
          title={t('planner.publish')}
        >
          <Eye className="h-3 w-3" />
        </Button>
      )}
      
      {canShowOnScreen && assignment.published && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleShowOnScreen} 
          className="h-7 w-7 p-0" 
          title={t('common.showOnScreen')}
        >
          <Monitor className="h-3 w-3" />
        </Button>
      )}
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleDeleteClick} 
        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" 
        title={t('planner.deleteAssignment')}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default AssignmentActionButtons;
