
import React from 'react';
import { Card } from '@/components/ui/card';
import { Assignment } from '../../types/assignment';
import { Car } from '../../types/car';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import AssignmentActionButtons from './AssignmentActionButtons';
import AssignmentDetails from './AssignmentDetails';
import { useTranslation } from '@/context/TranslationContext';
import { UserCheck } from 'lucide-react';

interface AssignmentCardProps {
  assignment: Assignment;
  cars: Car[];
  canEdit: boolean;
  onEdit: (assignment: Assignment) => void;
  onDelete: () => void;
  onPublish?: () => void;
  onCopy?: () => void;
  operationState?: 'publishing' | 'deleting' | 'updating' | null;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  cars,
  canEdit,
  onEdit,
  onDelete,
  onPublish,
  onCopy,
  operationState = null
}) => {
  const { t } = useTranslation();

  console.log(`[AssignmentCard] SAGSANSVARLIG DEBUG - Assignment: ${assignment.title || assignment.location}`);
  console.log(`[AssignmentCard] SAGSANSVARLIG DEBUG - Responsible user:`, assignment.responsibleUser);

  const handleEditClick = (assignment: Assignment) => {
    console.log('[AssignmentCard] Edit clicked for assignment:', assignment.id);
    onEdit(assignment);
  };

  const handleCopyClick = () => {
    if (onCopy) {
      console.log('[AssignmentCard] Copy clicked for assignment:', assignment.id);
      onCopy();
    }
  };

  const handlePublishClick = async () => {
    console.log('[AssignmentCard] Publish clicked for assignment:', assignment.id);
    
    if (onPublish) {
      try {
        await onPublish();
      } catch (error) {
        console.error('[AssignmentCard] Error in onPublish:', error);
      }
    }
  };

  const isPublished = assignment.published === true;
  const isLoading = operationState !== null;

  // Get operation text with translations
  const getOperationText = (state: 'publishing' | 'deleting' | 'updating') => {
    switch (state) {
      case 'publishing':
        return (t('common.publishing') || 'Publicerer') + '...';
      case 'deleting':
        return (t('common.deleting') || 'Sletter') + '...';
      case 'updating':
        return (t('common.updating') || 'Opdaterer') + '...';
      default:
        return (t('common.processing') || 'Behandler') + '...';
    }
  };

  // Get responsible user display name - CRITICAL FIX
  const getResponsibleUserName = () => {
    if (!assignment.responsibleUser) return null;
    return assignment.responsibleUser.name;
  };

  const responsibleUserName = getResponsibleUserName();

  return (
    <Card className={`w-full p-4 bg-white hover:border-polygon-purple transition-colors ${isLoading ? 'opacity-75' : ''}`}>
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-lg">{assignment.title || (t('planner.titleLabel') || 'Titel')}</h3>
              {/* CRITICAL FIX: Show Sagsansvarlig badge when present */}
              {responsibleUserName && (
                <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                  <UserCheck className="h-3 w-3" />
                  <span title={t('planner.responsibleUser') || 'Sagsansvarlig'}>
                    {responsibleUserName}
                  </span>
                </div>
              )}
            </div>
            {assignment.location && (
              <p className="text-sm text-gray-600">{assignment.location}</p>
            )}
          </div>
          <AssignmentStatusBadge isPublished={isPublished} />
          {operationState && (
            <span className="text-xs text-blue-600 font-medium animate-pulse">
              {getOperationText(operationState)}
            </span>
          )}
        </div>
        
        <AssignmentActionButtons 
          assignment={assignment}
          onEdit={handleEditClick}
          onDelete={onDelete}
          onPublish={async (assignmentId: string) => {
            await handlePublishClick();
          }}
          onCopy={handleCopyClick}
          operationState={operationState}
        />
      </div>
      
      {assignment.description && (
        <p className="text-gray-600 mb-3">{assignment.description}</p>
      )}
      
      <AssignmentDetails assignment={assignment} cars={cars} />
    </Card>
  );
};

export default AssignmentCard;
