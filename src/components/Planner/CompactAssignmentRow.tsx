import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Button } from '@/components/ui/button';
import { Pencil, Send, Trash2, Copy, MapPin, Clock, Users, Car as CarIcon } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import ConflictBadge from './ConflictBadge';
import { useAssignmentConflicts } from '@/hooks/useAssignmentConflicts';
import { useAssignments } from '@/hooks/useAssignments';
import { cn } from '@/lib/utils';

interface CompactAssignmentRowProps {
  assignment: Assignment;
  cars: Car[];
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPublish?: () => void;
  onCopy?: () => void;
  onViewDetails: () => void;
  operationState?: 'publishing' | 'deleting' | 'updating' | null;
}

const CompactAssignmentRow: React.FC<CompactAssignmentRowProps> = ({
  assignment,
  cars,
  canEdit,
  onEdit,
  onDelete,
  onPublish,
  onCopy,
  onViewDetails,
  operationState
}) => {
  const { t } = useTranslation();
  const { assignments: allAssignments } = useAssignments();
  const { getConflicts } = useAssignmentConflicts(allAssignments);
  const conflicts = getConflicts(assignment.id);
  const hasConflict = conflicts.length > 0;
  
  // Get car names
  const getCarNames = (): string[] => {
    const carIds = assignment.cars || (assignment.car ? [typeof assignment.car === 'string' ? assignment.car : assignment.car.id] : []);
    return carIds.map(carId => {
      const car = cars.find(c => c.id === carId);
      return car?.name || carId.substring(0, 6);
    });
  };
  
  // Get employee names
  const getEmployeeNames = (): string[] => {
    if (assignment.assignedEmployees && Array.isArray(assignment.assignedEmployees)) {
      return assignment.assignedEmployees.map(emp => 
        typeof emp === 'object' ? emp.name : emp
      );
    }
    return [];
  };
  
  const carNames = getCarNames();
  const employeeNames = getEmployeeNames();
  
  const carDisplay = carNames.length > 0 
    ? carNames.slice(0, 2).join(', ') + (carNames.length > 2 ? ` +${carNames.length - 2}` : '')
    : '-';
  
  const employeeDisplay = employeeNames.length > 0
    ? employeeNames.slice(0, 2).map(n => n.split(' ')[0]).join(', ') + (employeeNames.length > 2 ? ` +${employeeNames.length - 2}` : '')
    : '-';

  const isLoading = operationState != null;
  const timeDisplay = `${assignment.fromTime?.substring(0, 5) || ''} - ${assignment.toTime?.substring(0, 5) || ''}`;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <tr 
          className={cn(
            'hover:bg-accent/40 border-b group transition-colors cursor-pointer',
            hasConflict
              ? 'bg-destructive/5'
              : '',
            isLoading && 'opacity-60'
          )}
          onClick={onViewDetails}
        >
      {/* Time + status dot */}
      <td className="py-2.5 px-3 text-sm font-medium whitespace-nowrap text-foreground">
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn(
              'status-dot',
              hasConflict ? 'status-dot-conflict' : (assignment.published ? 'status-dot-published' : 'status-dot-draft')
            )}
          />
          <span className="chip chip-time chip-tabular chip-strong">
            <Clock className="h-3 w-3" />
            {timeDisplay}
          </span>
          {hasConflict && <ConflictBadge conflicts={conflicts} size="sm" />}
        </div>
      </td>
      
      {/* Case Number / Title */}
      <td className="py-2.5 px-3 text-sm text-foreground">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="truncate max-w-[140px] font-medium">
                {assignment.case_number || assignment.title || '-'}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{assignment.title}</p>
              {assignment.case_number && <p className="text-xs text-muted-foreground">Sag: {assignment.case_number}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>
      
      {/* Location */}
      <td className="py-2.5 px-3 text-sm text-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="truncate">{assignment.location || '-'}</span>
        </div>
      </td>
      
      {/* Car */}
      <td className="py-2.5 px-3 text-sm">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              {carNames.length > 0 ? (
                <span className="chip chip-car max-w-[140px]">
                  <CarIcon className="h-3 w-3" />
                  <span className="truncate">{carDisplay}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </TooltipTrigger>
            {carNames.length > 0 && (
              <TooltipContent side="top">
                <p>{carNames.join(', ')}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </td>
      
      {/* Team */}
      <td className="py-2.5 px-3 text-sm">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              {employeeNames.length > 0 ? (
                <span className="chip chip-person max-w-[160px]">
                  <Users className="h-3 w-3" />
                  <span className="truncate">{employeeDisplay}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </TooltipTrigger>
            {employeeNames.length > 0 && (
              <TooltipContent side="top">
                <p>{employeeNames.join(', ')}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </td>
      <td className="py-2.5 px-3">
        <AssignmentStatusBadge isPublished={assignment.published} />
      </td>
      
      {/* Actions - visible on hover */}
      <td className="py-2.5 px-3 text-right">
        <div 
          className="invisible group-hover:visible flex items-center justify-end gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-7 w-7 p-0" disabled={isLoading}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onCopy && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onCopy(); }} className="h-7 w-7 p-0" disabled={isLoading}>
              <Copy className="h-3.5 w-3.5 text-blue-600" />
            </Button>
          )}
          {!assignment.published && onPublish && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onPublish(); }} className="h-7 w-7 p-0" disabled={isLoading}>
              <Send className="h-3.5 w-3.5 text-green-600" />
            </Button>
          )}
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-7 w-7 p-0" disabled={isLoading}>
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          )}
        </div>
      </td>
        </tr>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {canEdit && (
          <ContextMenuItem onClick={onEdit} className="gap-2">
            <Pencil className="h-4 w-4" />
            {t('planner.contextMenu.edit')}
          </ContextMenuItem>
        )}
        {onCopy && (
          <ContextMenuItem onClick={onCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            {t('planner.contextMenu.duplicate')}
          </ContextMenuItem>
        )}
        {!assignment.published && onPublish && canEdit && (
          <ContextMenuItem onClick={onPublish} className="gap-2">
            <Send className="h-4 w-4" />
            {t('planner.contextMenu.publish')}
          </ContextMenuItem>
        )}
        {canEdit && <ContextMenuSeparator />}
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

export default CompactAssignmentRow;