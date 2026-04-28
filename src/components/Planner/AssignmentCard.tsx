
import React from 'react';
import { Card } from '@/components/ui/card';
import { Assignment } from '../../types/assignment';
import { Car } from '../../types/car';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import AssignmentActionButtons from './AssignmentActionButtons';
import AssignmentDetails from './AssignmentDetails';
import { useTranslation } from '@/context/TranslationContext';
import { UserCheck, Package, Pencil, Copy, Trash2, Send } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useWarehouseIndicators } from '@/hooks/warehouse/useWarehouseIndicators';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useAssignmentConflicts } from '@/hooks/useAssignmentConflicts';
import ConflictBadge from './ConflictBadge';
import { cn } from '@/lib/utils';

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
  assignment,
  cars,
  assignments = [],
  canEdit,
  onEdit,
  onDelete,
  onPublish,
  onCopy,
  onViewDetails,
  operationState = null
}) => {
  const { t } = useTranslation();
  const { employees } = useEmployees();
  const { data: warehouseIndicators } = useWarehouseIndicators();
  const { getConflicts } = useAssignmentConflicts(assignments);
  const conflicts = getConflicts(assignment.id);
  const hasConflict = conflicts.length > 0;

  const warehouseData = warehouseIndicators 
    ? (assignment.case_number && warehouseIndicators.get(assignment.case_number)) || 
      warehouseIndicators.get(assignment.title) || { count: 0, totalQuantity: 0 }
    : { count: 0, totalQuantity: 0 };
  const warehouseItemCount = warehouseData.totalQuantity;

  if (import.meta.env.DEV) {
    console.log(`[AssignmentCard] Assignment: ${assignment.title || assignment.location}`);
    if (import.meta.env.DEV) console.log(`[AssignmentCard] Employee data:`, {
      hasAssignedEmployees: !!assignment.assignedEmployees?.length,
      assignedEmployees: assignment.assignedEmployees?.map(e => e.name),
      hasLegacyEmployees: !!assignment.employees?.length,
      legacyEmployees: assignment.employees,
      responsibleUserId: assignment.responsibleUserId || assignment.responsibleUser?.id
    });
  }
  
  const getResponsibleUserInfo = () => {
    const responsibleId = assignment.responsibleUserId || assignment.responsibleUser?.id;
    
    if (!responsibleId) return null;

    if (assignment.responsibleUser?.name) {
      return {
        id: assignment.responsibleUser.id,
        name: assignment.responsibleUser.name,
        role: assignment.responsibleUser.role || 'unknown'
      };
    }

    const responsibleEmployee = employees.find(emp => emp.id === responsibleId);
    if (responsibleEmployee) {
      return {
        id: responsibleEmployee.id,
        name: responsibleEmployee.name,
        role: responsibleEmployee.role
      };
    }

    if (import.meta.env.DEV) {
      console.warn('[AssignmentCard] Responsible user not found:', responsibleId);
    }
    return null;
  };

  const responsibleUserInfo = getResponsibleUserInfo();

  const handleEditClick = (assignment: Assignment) => {
    onEdit(assignment);
  };

  const handleCopyClick = () => {
    if (onCopy) onCopy();
  };

  const handlePublishClick = async (assignmentId: string) => {
    if (onPublish) {
      try {
        await onPublish();
      } catch (error) {
        if (import.meta.env.DEV) console.error('[AssignmentCard] Error in onPublish:', error);
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

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
      return;
    }
    if (onViewDetails) {
      onViewDetails();
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card 
          className={cn(
            'relative w-full p-3 brand-card-hover bg-card border-border/60 shadow-xs',
            hasConflict && 'border-l-[3px] border-l-destructive ring-1 ring-destructive/20',
            isLoading && 'opacity-75',
            onViewDetails && 'cursor-pointer'
          )}
          onClick={handleCardClick}
        >
      {warehouseItemCount > 0 && (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 text-white rounded-full shadow-xs cursor-help">
                <Package className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold tabular-nums">{warehouseItemCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              align="end"
              sideOffset={8}
              className="max-w-xs z-[100]"
            >
              <p className="font-medium whitespace-normal">Der er {warehouseData.totalQuantity} møbelkasser/paller på lager</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Status dot */}
          <span
            aria-hidden
            className={cn(
              'status-dot mt-1.5',
              hasConflict ? 'status-dot-conflict' : (isPublished ? 'status-dot-published' : 'status-dot-draft')
            )}
          />
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-sm text-foreground tracking-tight truncate">
                {assignment.title || t('planner.titleLabel')}
              </h3>
              {hasConflict && <ConflictBadge conflicts={conflicts} size="sm" />}
              {operationState && (
                <span className="text-xs text-primary font-medium animate-pulse">
                  {getOperationText(operationState)}
                </span>
              )}
            </div>
            {assignment.location && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{assignment.location}</p>
            )}
            {responsibleUserInfo?.name && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="icon-bubble icon-bubble-sm icon-bubble-resp" aria-hidden>
                  <UserCheck className="h-3 w-3" />
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('planner.responsibleUser')}:
                </span>
                <span className="text-xs font-medium text-foreground">{responsibleUserInfo.name}</span>
              </div>
            )}
            {import.meta.env.DEV && assignment.responsibleUserId && !responsibleUserInfo && (
              <div className="flex items-center gap-1 mt-1">
                <UserCheck className="h-3 w-3 text-amber-600" />
                <span className="text-xs text-amber-600" title="Debug: Responsible user ID found but user data missing">
                  Missing User Data (Check Roles)
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <AssignmentStatusBadge isPublished={isPublished} />
          <AssignmentActionButtons
          assignment={assignment}
          onEdit={handleEditClick}
          onDelete={onDelete}
          onPublish={async (assignmentId: string) => {
            await handlePublishClick(assignmentId);
          }}
          onCopy={handleCopyClick}
            operationState={operationState}
          />
        </div>
      </div>
      
      {assignment.description && (
        <p className="text-muted-foreground mb-2 text-xs line-clamp-2">{assignment.description}</p>
      )}
      
      <AssignmentDetails assignment={assignment} cars={cars} assignments={assignments} showFullTeamDetails={true} />
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {canEdit && (
          <ContextMenuItem onClick={() => onEdit(assignment)} className="gap-2">
            <Pencil className="h-4 w-4" />
            {t('planner.contextMenu.edit')}
          </ContextMenuItem>
        )}
        {onCopy && (
          <ContextMenuItem onClick={handleCopyClick} className="gap-2">
            <Copy className="h-4 w-4" />
            {t('planner.contextMenu.duplicate')}
          </ContextMenuItem>
        )}
        {!assignment.published && onPublish && canEdit && (
          <ContextMenuItem onClick={() => handlePublishClick(assignment.id)} className="gap-2">
            <Send className="h-4 w-4" />
            {t('planner.contextMenu.publish')}
          </ContextMenuItem>
        )}
        {(canEdit) && <ContextMenuSeparator />}
        {canEdit && (
          <ContextMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4" />
            {t('planner.contextMenu.delete')}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default AssignmentCard;
