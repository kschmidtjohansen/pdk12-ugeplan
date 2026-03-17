
import React from 'react';
import { Assignment } from '../../types/assignment';
import { Car } from '../../types/car';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import AssignmentActionButtons from './AssignmentActionButtons';
import AssignmentDetails from './AssignmentDetails';
import { useTranslation } from '@/context/TranslationContext';
import { UserCheck, Package } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useWarehouseIndicators } from '@/hooks/warehouse/useWarehouseIndicators';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AssignmentCardProps {
  assignment: Assignment;
  cars: Car[];
  assignments?: Assignment[];
  canEdit: boolean;
  onEdit: (assignment: Assignment) => void;
  onDelete: () => void;
  onPublish?: () => void;
  onCopy?: () => void;
  onViewDetails?: () => void;
  operationState?: 'publishing' | 'deleting' | 'updating' | null;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment, cars, assignments = [], canEdit, onEdit, onDelete,
  onPublish, onCopy, onViewDetails, operationState = null
}) => {
  const { t } = useTranslation();
  const { employees } = useEmployees();
  const { data: warehouseIndicators } = useWarehouseIndicators();
  
  const warehouseData = warehouseIndicators 
    ? (assignment.case_number && warehouseIndicators.get(assignment.case_number)) || 
      warehouseIndicators.get(assignment.title) || { count: 0, totalQuantity: 0 }
    : { count: 0, totalQuantity: 0 };
  const warehouseItemCount = warehouseData.totalQuantity;

  const getResponsibleUserInfo = () => {
    const responsibleId = assignment.responsibleUserId || assignment.responsibleUser?.id;
    if (!responsibleId) return null;
    if (assignment.responsibleUser?.name) {
      return { id: assignment.responsibleUser.id, name: assignment.responsibleUser.name, role: assignment.responsibleUser.role || 'unknown' };
    }
    const responsibleEmployee = employees.find(emp => emp.id === responsibleId);
    if (responsibleEmployee) {
      return { id: responsibleEmployee.id, name: responsibleEmployee.name, role: responsibleEmployee.role };
    }
    return null;
  };

  const responsibleUserInfo = getResponsibleUserInfo();
  const isPublished = assignment.published === true;
  const isLoading = operationState !== null;

  const getOperationText = (state: 'publishing' | 'deleting' | 'updating') => {
    switch (state) {
      case 'publishing': return t('planner.operations.publishing') + '...';
      case 'deleting': return t('planner.operations.deleting') + '...';
      case 'updating': return t('planner.operations.updating') + '...';
      default: return t('planner.operations.processing') + '...';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) return;
    if (onViewDetails) onViewDetails();
  };

  return (
    <div 
      className={`glass-card card-hover-glow rounded-lg border overflow-hidden ${isLoading ? 'opacity-75' : ''} ${onViewDetails ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Warehouse indicator */}
        {warehouseItemCount > 0 && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="float-right ml-2 flex items-center gap-1 px-2 py-0.5 bg-warning/10 text-warning border border-warning/20 rounded-md text-xs font-medium cursor-help">
                  <Package className="h-3.5 w-3.5" />
                  <span>{warehouseItemCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="z-[100]">
                <p className="text-sm">Der er {warehouseData.totalQuantity} møbelkasser/paller på lager</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">{assignment.title || t('planner.titleLabel')}</h3>
              {operationState && (
                <span className="text-xs text-primary font-medium animate-pulse">{getOperationText(operationState)}</span>
              )}
            </div>
            {assignment.location && <p className="text-xs text-muted-foreground truncate">{assignment.location}</p>}
            {responsibleUserInfo?.name && (
              <div className="flex items-center gap-1 mt-0.5">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-foreground font-medium">{t('planner.responsibleUser')}: {responsibleUserInfo.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <AssignmentStatusBadge isPublished={isPublished} />
            <AssignmentActionButtons
              assignment={assignment} onEdit={(a) => onEdit(a)} onDelete={onDelete}
              onPublish={async (id: string) => { if (onPublish) await onPublish(); }}
              onCopy={() => { if (onCopy) onCopy(); }}
              operationState={operationState}
            />
          </div>
        </div>
        
        {assignment.description && (
          <p className="text-muted-foreground mb-2 text-xs line-clamp-2">{assignment.description}</p>
        )}
        
        <AssignmentDetails assignment={assignment} cars={cars} assignments={assignments} showFullTeamDetails={true} />
      </div>
    </div>
  );
};

export default AssignmentCard;
