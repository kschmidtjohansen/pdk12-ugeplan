
import React, { memo } from 'react';
import { usePermissions } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Mail, Phone, Trash2, UserMinus, UserCheck, HardHat, Truck, Car, Forklift } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { getEmployeeAvailabilityStatus } from '@/utils/employeeAvailability';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface EmployeeTableRowProps {
  employee: Employee;
  vacations: Vacation[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave?: (employee: Employee) => void;
}

const EmployeeTableRow: React.FC<EmployeeTableRowProps> = memo(({ employee, vacations, onEdit, onDelete, onToggleLeave }) => {
  const { isAdmin, isSkadeleder } = usePermissions();
  const { t } = useTranslation();

  // Get role variant for status badge
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'warning';
      case 'administrator': 
        return 'info';
      case 'skadeleder': 
        return 'success';
      default: 
        return 'default';
    }
  };

  // Get role label using translation
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return t('employees.super_admin');
      case 'administrator':
        return t('employees.administrator');
      case 'skadeleder':
        return t('employees.skadeleder');
      case 'servicemedarbejder':
        return t('employees.servicemedarbejder');
      case 'vikar':
        return t('employees.vikar');
      default:
        return role;
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get employee availability status including vacation status
  const availabilityInfo = getEmployeeAvailabilityStatus(
    employee, 
    new Date(), 
    [], // No assignments needed for employee page status 
    vacations, 
    t
  );

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={employee.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-polygon-blue text-white">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <span>{employee.name}</span>
        </div>
        {(isAdmin || isSkadeleder) && employee.notes && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground mt-1 cursor-help">
                  {t('employees.viewNotes')}
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{employee.notes}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
            {employee.email}
          </div>
          <div className="flex items-center text-sm">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            {employee.phone}
          </div>
        </div>
      </TableCell>
      <TableCell>{employee.jobTitle}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {employee.has_asbestos_certificate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-polygon-blue">
                    <HardHat className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t('employees.asbestosCertificate')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {employee.has_trailer_license && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-polygon-blue">
                    <Truck className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t('employees.trailerLicense')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {employee.has_forklift_license && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-polygon-blue">
                    <Forklift className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t('employees.forkliftLicense')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
        </div>
      </TableCell>
      
      {(isAdmin) && (
        <TableCell>
          <StatusBadge variant={getRoleVariant(employee.role)}>
            {getRoleLabel(employee.role)}
          </StatusBadge>
        </TableCell>
      )}
      <TableCell>
        <StatusBadge variant={availabilityInfo.badgeVariant}>
          {availabilityInfo.statusText}
        </StatusBadge>
      </TableCell>
      {isAdmin && (
        <TableCell>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(employee)} 
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">{t("common.edit")}</span>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("common.edit")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {onToggleLeave && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onToggleLeave(employee)}
                      className={`h-8 w-8 p-0 ${employee.onLeave ? 'text-green-600' : 'text-amber-600'}`}
                    >
                      <span className="sr-only">
                        {employee.onLeave ? t("employees.markAvailable") : t("employees.markOnLeave")}
                      </span>
                      {employee.onLeave ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{employee.onLeave ? t("employees.markAvailable") : t("employees.markOnLeave")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDelete(employee)} 
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <span className="sr-only">{t("common.delete")}</span>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("common.delete")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
});

EmployeeTableRow.displayName = 'EmployeeTableRow';

export default EmployeeTableRow;
