
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
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
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();

  const canPerformActions = user?.role === 'administrator' || user?.role === 'skadeleder' || user?.role === 'super_admin';
  const canShowOnScreen = user?.role === 'administrator' || user?.role === 'skadeleder' || user?.role === 'super_admin';

  if (!canPerformActions) {
    return null;
  }

  const isLoading = operationState !== null;
  const isPublishing = operationState === 'publishing';
  const isDeleting = operationState === 'deleting';
  const isUpdating = operationState === 'updating';

  const handleEditClick = () => {
    if (isLoading) return;
    if (import.meta.env.DEV) console.log('[AssignmentActionButtons] Edit clicked:', assignment.id);
    onEdit(assignment);
  };

  const handlePublishClick = async () => {
    if (isLoading || assignment.published) return;
    
    if (import.meta.env.DEV) console.log('[AssignmentActionButtons] Publish clicked:', assignment.id);
    try {
      await onPublish(assignment.id);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[AssignmentActionButtons] Error in onPublish:', error);
    }
  };

  const handleShowOnScreen = () => {
    if (isLoading) return;
    try {
      const timestamp = Date.now();
      const params = new URLSearchParams({
        date: assignment.date,
        t: String(timestamp),
        source: 'button',
      });
      if (selectedDepartmentId) params.set('departmentId', selectedDepartmentId);
      if (selectedSubDepartmentId) params.set('subDepartmentId', selectedSubDepartmentId);
      const url = `/screen-display?${params.toString()}`;
      
      if (import.meta.env.DEV) console.log('[AssignmentActionButtons] Opening screen display:', url);
      
      // Open window with specific features for better control
      const newWindow = window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      // Focus the new window
      if (newWindow) {
        newWindow.focus();
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[AssignmentActionButtons] Error opening screen display:', error);
    }
  };

  const handleDeleteClick = () => {
    if (isLoading) return;
    if (import.meta.env.DEV) console.log('[AssignmentActionButtons] Delete clicked:', assignment.id);
    onDelete(assignment.id);
  };

  const handleCopyClick = () => {
    if (isLoading) return;
    if (import.meta.env.DEV) console.log('[AssignmentActionButtons] Copy clicked:', assignment.id);
    onCopy(assignment);
  };

  const editLabel = isUpdating ? t('planner.operations.updating') : t('planner.editAssignment');
  const publishLabel = isPublishing ? t('planner.operations.publishing') : t('planner.publish');
  const deleteLabel = isDeleting ? t('planner.operations.deleting') : t('planner.deleteAssignment');

  return (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleEditClick}
        disabled={isLoading}
        className="h-7 w-7 p-0 touch-target" 
        title={editLabel}
        aria-label={editLabel}
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
        className="h-7 w-7 p-0 touch-target" 
        title={t('planner.copyAssignment')}
        aria-label={t('planner.copyAssignment')}
      >
        <Copy className="h-3 w-3" />
      </Button>
      
      {!assignment.published && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handlePublishClick}
          disabled={isLoading}
          className="h-7 w-7 p-0 touch-target text-success hover:text-success hover:bg-success-soft disabled:opacity-50" 
          title={publishLabel}
          aria-label={publishLabel}
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
          className="h-7 w-7 p-0 touch-target" 
          title={t('common.showOnScreen')}
          aria-label={t('common.showOnScreen')}
        >
          <Monitor className="h-3 w-3" />
        </Button>
      )}
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleDeleteClick}
        disabled={isLoading}
        className="h-7 w-7 p-0 touch-target text-destructive hover:text-destructive hover:bg-destructive-soft disabled:opacity-50" 
        title={deleteLabel}
        aria-label={deleteLabel}
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

export default React.memo(AssignmentActionButtons);
