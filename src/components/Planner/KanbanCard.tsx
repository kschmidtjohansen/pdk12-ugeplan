import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { useTranslation } from '@/context/TranslationContext';
import { Clock, UserCheck, Car as CarIcon, Users, MapPin, FileText, Pencil, Copy, Send, Trash2 } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';

interface KanbanCardProps {
  assignment: Assignment;
  cars: Car[];
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPublish?: () => void;
  onCopy?: () => void;
  operationState?: 'publishing' | 'deleting' | 'updating' | null;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
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
  
  const isPublished = assignment.published === true;
  const isLoading = operationState !== null;

  // Get responsible user info
  const getResponsibleUserInfo = () => {
    const responsibleId = assignment.responsibleUserId || assignment.responsibleUser?.id;
    
    if (!responsibleId) return null;

    if (assignment.responsibleUser?.name) {
      return assignment.responsibleUser.name;
    }

    const responsibleEmployee = employees.find(emp => emp.id === responsibleId);
    return responsibleEmployee?.name || null;
  };

  // Get car names
  const getCarNames = () => {
    const carIds: string[] = [];
    
    if (assignment.car) {
      if (typeof assignment.car === 'string') {
        carIds.push(assignment.car);
      } else if (assignment.car.id) {
        carIds.push(assignment.car.id);
      }
    }
    
    if (assignment.cars && Array.isArray(assignment.cars)) {
      carIds.push(...assignment.cars);
    }

    const uniqueCarIds = [...new Set(carIds)];
    
    return uniqueCarIds
      .map(carId => {
        const car = cars.find(c => c.id === carId);
        return car?.name || car?.car_number || null;
      })
      .filter(Boolean)
      .join(', ');
  };

  // Get employee names
  const getEmployeeNames = () => {
    // First check assignedEmployees (PHASE 3 format)
    if (assignment.assignedEmployees && assignment.assignedEmployees.length > 0) {
      return assignment.assignedEmployees.map(emp => emp.name);
    }
    
    // Fallback to employees array (IDs)
    if (assignment.employees && assignment.employees.length > 0) {
      return assignment.employees
        .map(empId => {
          const employee = employees.find(e => e.id === empId);
          return employee?.name || null;
        })
        .filter(Boolean) as string[];
    }
    
    return [];
  };

  const responsibleUserName = getResponsibleUserInfo();
  const carNames = getCarNames();
  const employeeNames = getEmployeeNames();

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
    <Card className={`p-4 bg-card hover:shadow-lg transition-all duration-200 border-border ${isLoading ? 'opacity-60' : ''}`}>
      {/* Header: Case number */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-base text-foreground truncate">
            {assignment.case_number || assignment.title || t('planner.titleLabel')}
          </span>
        </div>
        {!isPublished && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 flex-shrink-0">
            {t('planner.notPublished')}
          </Badge>
        )}
      </div>
      
      {/* Address */}
      <div className="flex items-start gap-2 mb-3">
        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <span className="text-sm text-muted-foreground">
          {assignment.location || '-'}
        </span>
      </div>
      
      <Separator className="my-3" />
      
      {/* Info Grid */}
      <div className="space-y-2.5 text-sm">
        {/* Time */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-foreground font-medium">
            {assignment.fromTime} - {assignment.toTime}
          </span>
        </div>
        
        {/* Responsible User */}
        {responsibleUserName && (
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-foreground">{responsibleUserName}</span>
          </div>
        )}
        
        {/* Car */}
        {carNames && (
          <div className="flex items-center gap-2">
            <CarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">{carNames}</span>
          </div>
        )}
        
        {/* Employees */}
        {employeeNames.length > 0 && (
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1.5">
              {employeeNames.map((name, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                >
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Separator className="my-3" />
      
      {/* Actions */}
      <div className="flex items-center justify-end gap-1">
        {operationState && (
          <span className="text-xs text-primary font-medium animate-pulse mr-auto">
            {getOperationText(operationState)}
          </span>
        )}
        
        {canEdit && (
          <>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onEdit}
              disabled={isLoading}
              className="h-8 px-2"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            
            {onCopy && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onCopy}
                disabled={isLoading}
                className="h-8 px-2"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onDelete}
              disabled={isLoading}
              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            
            {!isPublished && onPublish && (
              <Button 
                size="sm" 
                onClick={onPublish}
                disabled={isLoading}
                className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                {t('planner.publish')}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default KanbanCard;
