import React from 'react';
import { Card } from '@/components/ui/card';
import { Assignment } from '../../types/assignment';
import { Car } from '../../types/car';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import AssignmentActionButtons from './AssignmentActionButtons';
import AssignmentDetails from './AssignmentDetails';
import { useTranslation } from '@/context/TranslationContext';
import { UserCheck } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';

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
  const { employees } = useEmployees();

  console.log(`[AssignmentCard] ROLE UPDATE FIX - Assignment: ${assignment.title || assignment.location}`);
  console.log(`[AssignmentCard] Responsible user ID: ${assignment.responsibleUserId}`);
  
  // Enhanced responsible user lookup optimized for the new 7-user structure
  const getResponsibleUserInfo = () => {
    if (!assignment.responsibleUserId) {
      console.log('[AssignmentCard] No responsible user ID');
      return null;
    }

    // First check if we have the user data from the assignment object
    if (assignment.responsibleUser?.name) {
      console.log('[AssignmentCard] Using assignment.responsibleUser:', assignment.responsibleUser.name);
      return assignment.responsibleUser;
    }

    // Enhanced lookup from employees for the updated role structure
    const responsibleEmployee = employees.find(emp => emp.id === assignment.responsibleUserId);
    if (responsibleEmployee) {
      console.log('[AssignmentCard] Found responsible user via employees lookup:', responsibleEmployee.name, responsibleEmployee.role);
      
      // Verify the user has the correct role for being a responsible user
      const isEligible = responsibleEmployee.role === 'administrator' || responsibleEmployee.role === 'skadeleder';
      console.log('[AssignmentCard] User role eligibility check:', isEligible);
      
      return {
        id: responsibleEmployee.id,
        name: responsibleEmployee.name,
        role: responsibleEmployee.role
      };
    }

    console.warn('[AssignmentCard] Responsible user not found in employees list');
    return null;
  };

  const responsibleUserInfo = getResponsibleUserInfo();

  console.log(`[AssignmentCard] Final responsible user info:`, responsibleUserInfo);

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

  return (
    <Card className={`w-full p-4 bg-white hover:border-polygon-purple transition-colors ${isLoading ? 'opacity-75' : ''}`}>
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-lg">{assignment.title || (t('planner.titleLabel') || 'Titel')}</h3>
              {/* ROLE UPDATE FIX: Enhanced Sagsansvarlig badge optimized for 7-user structure */}
              {responsibleUserInfo?.name && (
                <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium border border-indigo-200">
                  <UserCheck className="h-3 w-3" />
                  <span title={`${t('planner.responsibleUser') || 'Sagsansvarlig'}: ${responsibleUserInfo.name}${responsibleUserInfo.role ? ` (${responsibleUserInfo.role})` : ''}`}>
                    {responsibleUserInfo.name}
                  </span>
                </div>
              )}
              {/* Enhanced debug info for development with role structure context */}
              {process.env.NODE_ENV === 'development' && assignment.responsibleUserId && !responsibleUserInfo && (
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-200">
                  <UserCheck className="h-3 w-3" />
                  <span title="Debug: Responsible user ID found but user data missing - check if roles are properly assigned">
                    Missing User Data (Check Roles)
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
