
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { Assignment } from '@/types/assignment';
import { Edit3, Trash2, Eye, Copy, Monitor, Loader2 } from 'lucide-react';

interface AssignmentActionButtonsProps {
  assignment: Assignment;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignmentId: string) => void;
  onPublish: (assignmentId: string) => void;
  onCopy: (assignment: Assignment) => void;
  operationState?: 'publishing' | 'deleting' | 'updating' | null;
}

export const AssignmentActionButtons: React.FC<AssignmentActionButtonsProps> = ({
  assignment,
  onEdit,
  onDelete,
  onPublish,
  onCopy,
  operationState = null
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const canPerformActions = user?.role === 'administrator' || user?.role === 'skadeleder';
  const canShowOnScreen = user?.role === 'administrator' || user?.role === 'skadeleder';

  if (!canPerformActions) {
    return null;
  }

  const isLoading = operationState !== null;
  const isPublishing = operationState === 'publishing';
  const isDeleting = operationState === 'deleting';
  const isUpdating = operationState === 'updating';

  const handleEditClick = () => {
    if (isLoading) return;
    console.log('[AssignmentActionButtons] Edit button clicked for assignment:', assignment.id);
    onEdit(assignment);
  };

  const handlePublishClick = async () => {
    if (isLoading || assignment.published) return;
    
    console.log('[AssignmentActionButtons] Publish button clicked for assignment:', assignment.id);
    try {
      await onPublish(assignment.id);
    } catch (error) {
      console.error('[AssignmentActionButtons] Error in onPublish:', error);
    }
  };

  const handleShowOnScreen = () => {
    if (isLoading) return;
    try {
      console.log('[AssignmentActionButtons] Opening screen display for date:', assignment.date);
      const screenUrl = `/screen-display?date=${assignment.date}&t=${Date.now()}`;
      window.open(screenUrl, '_blank', 'fullscreen=yes');
    } catch (error) {
      console.error('[AssignmentActionButtons] Error opening screen display:', error);
    }
  };

  const handleDeleteClick = () => {
    if (isLoading) return;
    console.log('[AssignmentActionButtons] Delete button clicked for assignment:', assignment.id);
    onDelete(assignment.id);
  };

  const handleCopyClick = () => {
    if (isLoading) return;
    console.log('[AssignmentActionButtons] Copy button clicked for assignment:', assignment.id);
    onCopy(assignment);
  };

  return (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleEditClick}
        disabled={isLoading}
        className="h-7 w-7 p-0" 
        title={isUpdating ? 'Updating...' : t('planner.editAssignment')}
      >
        {isUpdating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Edit3 className="h-3 w-3" />
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleCopyClick}
        disabled={isLoading}
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
          disabled={isLoading}
          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50" 
          title={isPublishing ? 'Publishing...' : t('planner.publish')}
        >
          {isPublishing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </Button>
      )}
      
      {canShowOnScreen && assignment.published && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleShowOnScreen}
          disabled={isLoading}
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
        disabled={isLoading}
        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50" 
        title={isDeleting ? 'Deleting...' : t('planner.deleteAssignment')}
      >
        {isDeleting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
};

export default AssignmentActionButtons;
