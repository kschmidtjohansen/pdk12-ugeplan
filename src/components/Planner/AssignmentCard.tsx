
import React from 'react';
import { Assignment } from '../../types/assignment';
import { Car } from '../../types/car';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import AssignmentActionButtons from './AssignmentActionButtons';
import { useTranslation } from '@/context/TranslationContext';
import { UserCheck, Package, Car as CarIcon } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useWarehouseIndicators } from '@/hooks/warehouse/useWarehouseIndicators';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { filterDisplayNames } from '@/utils/people';

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
  
  const warehouseData = warehouseIndicators 
    ? (assignment.case_number && warehouseIndicators.get(assignment.case_number)) || 
      warehouseIndicators.get(assignment.title) || { count: 0, totalQuantity: 0 }
    : { count: 0, totalQuantity: 0 };
  const warehouseItemCount = warehouseData.totalQuantity;

  // Get employee display names
  const getDisplayEmployees = (): string[] => {
    const names: string[] = [];
    if (assignment.assignedEmployees?.length) {
      names.push(...assignment.assignedEmployees.map(emp => emp.name || emp.email || ''));
    }
    if (assignment.employees?.length) {
      names.push(...assignment.employees);
    }
    return filterDisplayNames(names);
  };

  const displayEmployees = getDisplayEmployees();

  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Get car names
  const getCarNames = (): string[] => {
    const carIds: string[] = [];
    if (assignment.cars?.length) {
      carIds.push(...assignment.cars.filter(Boolean));
    } else if (assignment.car) {
      if (typeof assignment.car === 'string') carIds.push(assignment.car);
      else if (assignment.car.id) carIds.push(assignment.car.id);
    }
    return carIds
      .map(id => cars.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];
  };

  const carNames = getCarNames();
  
  const getResponsibleUserInfo = () => {
    const responsibleId = assignment.responsibleUserId || assignment.responsibleUser?.id;
    if (!responsibleId) return null;
    if (assignment.responsibleUser?.name) return assignment.responsibleUser;
    const emp = employees.find(e => e.id === responsibleId);
    if (emp) return { id: emp.id, name: emp.name, role: emp.role };
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

  const fromTime = assignment.fromTime ? assignment.fromTime.substring(0, 5) : '00:00';
  const toTime = assignment.toTime ? assignment.toTime.substring(0, 5) : '00:00';

  return (
    <div
      className={`group relative bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:scale-[1.01] hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)] hover:bg-white dark:hover:bg-card transition-all duration-300 overflow-hidden ${isLoading ? 'opacity-75' : ''} ${onViewDetails ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      {/* Top accent bar */}
      <div className="h-0.5 bg-primary" />

      <div className="flex min-h-[72px]">
        {/* Left: Time column */}
        <div className="w-20 flex-shrink-0 border-r border-border/20 dark:border-border/30 flex flex-col items-center justify-center py-3 px-2">
          <span className="text-xs font-bold text-foreground">{fromTime}</span>
          <div className="w-4 h-px bg-border my-1" />
          <span className="text-xs text-muted-foreground">{toTime}</span>
        </div>

        {/* Middle: Details */}
        <div className="flex-1 py-3 px-4 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-foreground truncate">
              {assignment.title || t('planner.titleLabel')}
            </h3>
            {operationState && (
              <span className="text-xs text-blue-600 font-medium animate-pulse">
                {getOperationText(operationState)}
              </span>
            )}
          </div>

          {assignment.location && (
            <p className="text-xs text-muted-foreground truncate">{assignment.location}</p>
          )}

          {responsibleUserInfo?.name && (
            <div className="flex items-center gap-1 mt-0.5">
              <UserCheck className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">
                {responsibleUserInfo.name}
              </span>
            </div>
          )}

          {assignment.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{assignment.description}</p>
          )}

          {/* Inline pills: cars + warehouse */}
          {(carNames.length > 0 || warehouseItemCount > 0) && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {carNames.map((name, i) => (
                <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  <CarIcon className="h-2.5 w-2.5 mr-0.5" />
                  {name}
                </Badge>
              ))}
              {warehouseItemCount > 0 && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 cursor-help">
                        <Package className="h-2.5 w-2.5 mr-0.5" />
                        {warehouseItemCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="z-[100]">
                      <p className="text-xs font-medium">
                        {warehouseData.totalQuantity} møbelkasser/paller på lager
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>

        {/* Right: People & Status */}
        <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center py-3 px-2 gap-2">
          {/* Overlapping avatar stack */}
          {displayEmployees.length > 0 && (
            <div className="flex -space-x-2">
              {displayEmployees.slice(0, 3).map((name, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-primary/15 dark:bg-primary/25 text-primary font-semibold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-card border border-primary/20"
                  title={name}
                >
                  {getInitials(name)}
                </div>
              ))}
              {displayEmployees.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground font-semibold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-card border border-border">
                  +{displayEmployees.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Status badge */}
          <AssignmentStatusBadge isPublished={isPublished} />

          {/* Action buttons on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:block hidden">
            <AssignmentActionButtons
              assignment={assignment}
              onEdit={onEdit}
              onDelete={onDelete}
              onPublish={onPublish ? async (id: string) => { await onPublish(); } : undefined}
              onCopy={onCopy || undefined}
              operationState={operationState}
            />
          </div>
          {/* Always visible on mobile */}
          <div className="sm:hidden">
            <AssignmentActionButtons
              assignment={assignment}
              onEdit={onEdit}
              onDelete={onDelete}
              onPublish={onPublish ? async (id: string) => { await onPublish(); } : undefined}
              onCopy={onCopy || undefined}
              operationState={operationState}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCard;
