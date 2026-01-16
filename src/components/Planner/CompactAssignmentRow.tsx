import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Send, Trash2, Copy, MapPin, Clock, Users, Car as CarIcon } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AssignmentStatusBadge from './AssignmentStatusBadge';

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

  const isLoading = operationState !== null;
  const timeDisplay = `${assignment.fromTime?.substring(0, 5) || ''} - ${assignment.toTime?.substring(0, 5) || ''}`;

  return (
    <tr 
      className={`hover:bg-muted/50 border-b group transition-colors cursor-pointer ${isLoading ? 'opacity-60' : ''}`}
      onClick={onViewDetails}
    >
      {/* Time */}
      <td className="py-2.5 px-3 text-sm font-medium whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeDisplay}</span>
        </div>
      </td>
      
      {/* Case Number / Title */}
      <td className="py-2.5 px-3 text-sm">
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
      <td className="py-2.5 px-3 text-sm text-muted-foreground">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{assignment.location || '-'}</span>
              </div>
            </TooltipTrigger>
            {assignment.location && (
              <TooltipContent side="top">
                <p>{assignment.location}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </td>
      
      {/* Car */}
      <td className="py-2.5 px-3 text-sm">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <CarIcon className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs truncate max-w-[80px]">{carDisplay}</span>
              </div>
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
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {employeeDisplay}
                </span>
              </div>
            </TooltipTrigger>
            {employeeNames.length > 0 && (
              <TooltipContent side="top">
                <p>{employeeNames.join(', ')}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </td>
      
      {/* Status */}
      <td className="py-2.5 px-3">
        <AssignmentStatusBadge isPublished={assignment.published} />
      </td>
      
      {/* Actions - visible on hover */}
      <td className="py-2.5 px-3 text-right">
        <div 
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 w-7 p-0" disabled={isLoading}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onCopy && (
            <Button variant="ghost" size="sm" onClick={onCopy} className="h-7 w-7 p-0" disabled={isLoading}>
              <Copy className="h-3.5 w-3.5 text-blue-600" />
            </Button>
          )}
          {!assignment.published && onPublish && (
            <Button variant="ghost" size="sm" onClick={onPublish} className="h-7 w-7 p-0" disabled={isLoading}>
              <Send className="h-3.5 w-3.5 text-green-600" />
            </Button>
          )}
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0" disabled={isLoading}>
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default CompactAssignmentRow;