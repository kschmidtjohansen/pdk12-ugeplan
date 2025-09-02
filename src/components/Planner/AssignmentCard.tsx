
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Assignment } from '../../types/assignment';
import { Car } from '../../types/car';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import AssignmentActionButtons from './AssignmentActionButtons';
import AssignmentDetails from './AssignmentDetails';
import { AssignmentViewDialog } from './AssignmentViewDialog';
import { OneDriveFolderButton } from '@/components/OneDrive/OneDriveFolderButton';
import { useTranslation } from '@/context/TranslationContext';
import { UserCheck, Eye } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';

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
  const [showViewDialog, setShowViewDialog] = useState(false);

  console.log(`[AssignmentCard] COMPREHENSIVE FIX - Assignment: ${assignment.title || assignment.location}`);
  console.log(`[AssignmentCard] COMPREHENSIVE FIX - Employee data:`, {
    hasAssignedEmployees: !!assignment.assignedEmployees?.length,
    assignedEmployees: assignment.assignedEmployees?.map(e => e.name),
    hasLegacyEmployees: !!assignment.employees?.length,
    legacyEmployees: assignment.employees,
    responsibleUserId: assignment.responsibleUserId || assignment.responsibleUser?.id
  });
  
  // PHASE 1 FIX: Enhanced responsible user lookup with comprehensive debugging
  const getResponsibleUserInfo = () => {
    console.log('[AssignmentCard] DEBUG - Getting responsible user info:', {
      assignmentId: assignment.id,
      responsibleUserId: assignment.responsibleUserId,
      responsibleUserFromAssignment: assignment.responsibleUser,
      employeesCount: employees.length,
      hasResponsibleUserId: !!assignment.responsibleUserId
    });

    // Check multiple possible sources for responsible user ID
    const responsibleId = assignment.responsibleUserId || assignment.responsibleUser?.id;
    
    if (!responsibleId) {
      console.log('[AssignmentCard] DEBUG - No responsible user ID found');
      return null;
    }

    // First check if we have the user data from the assignment object
    if (assignment.responsibleUser?.name) {
      console.log('[AssignmentCard] DEBUG - Using assignment.responsibleUser:', assignment.responsibleUser.name);
      return {
        id: assignment.responsibleUser.id,
        name: assignment.responsibleUser.name,
        role: assignment.responsibleUser.role || 'unknown'
      };
    }

    // Enhanced lookup from employees with detailed logging
    console.log('[AssignmentCard] DEBUG - Searching in employees list:', {
      searchingForId: responsibleId,
      employeeIds: employees.map(e => ({ id: e.id.substring(0, 8) + '...', name: e.name, role: e.role }))
    });

    const responsibleEmployee = employees.find(emp => emp.id === responsibleId);
    if (responsibleEmployee) {
      console.log('[AssignmentCard] DEBUG - Found responsible user via employees lookup:', {
        name: responsibleEmployee.name,
        role: responsibleEmployee.role,
        id: responsibleEmployee.id.substring(0, 8) + '...'
      });
      
      return {
        id: responsibleEmployee.id,
        name: responsibleEmployee.name,
        role: responsibleEmployee.role
      };
    }

    console.warn('[AssignmentCard] DEBUG - Responsible user not found anywhere:', {
      searchedId: responsibleId,
      totalEmployees: employees.length,
      assignmentTitle: assignment.title
    });
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
        return t('planner.operations.publishing') + '...';
      case 'deleting':
        return t('planner.operations.deleting') + '...';
      case 'updating':
        return t('planner.operations.updating') + '...';
      default:
        return t('planner.operations.processing') + '...';
    }
  };

  return (
    <Card className={`w-full p-4 bg-white hover:border-polygon-purple transition-colors ${isLoading ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-lg">{assignment.case_number || t('planner.titleLabel')}</h3>
              {operationState && (
                <span className="text-xs text-blue-600 font-medium animate-pulse">
                  {getOperationText(operationState)}
                </span>
              )}
            </div>
            {assignment.location && (
              <p className="text-sm text-gray-600">{assignment.location}</p>
            )}
            {/* Enhanced responsible user display with proper label */}
            {responsibleUserInfo?.name && (
              <div className="flex items-center gap-1 mt-1">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-800 font-medium">
                  {t('planner.responsibleUser')}: {responsibleUserInfo.name}
                </span>
              </div>
            )}
            {/* Enhanced debug info for development with role structure context */}
            {process.env.NODE_ENV === 'development' && assignment.responsibleUserId && !responsibleUserInfo && (
              <div className="flex items-center gap-1 mt-1">
                <UserCheck className="h-3 w-3 text-yellow-600" />
                <span className="text-xs text-yellow-600" title="Debug: Responsible user ID found but user data missing - check if roles are properly assigned">
                  Missing User Data (Check Roles)
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <AssignmentStatusBadge isPublished={isPublished} />
          
          {/* OneDrive Button */}
          {assignment.case_number && (
            <OneDriveFolderButton caseNumber={assignment.case_number} />
          )}
          
          {/* View Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowViewDialog(true)}
            className="h-8 w-8 p-0"
            title="Se detaljer"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
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
      </div>
      
      {assignment.description && (
        <p className="text-gray-600 mb-3">{assignment.description}</p>
      )}
      
      <AssignmentDetails assignment={assignment} cars={cars} showFullTeamDetails={true} />
      
      {/* Assignment View Dialog */}
      <AssignmentViewDialog
        assignment={assignment}
        cars={cars}
        isOpen={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        onEdit={canEdit ? onEdit : undefined}
        canEdit={canEdit}
      />
    </Card>
  );
};

export default AssignmentCard;
