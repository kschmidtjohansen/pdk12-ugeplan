
import React, { memo } from 'react';
import { usePermissions } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Mail, Phone, Trash2, UserMinus, UserCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Employee } from '@/types/employee';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface USER_ROLES_TYPE {
  value: string;
  label: string;
}

const USER_ROLES: USER_ROLES_TYPE[] = [{
  value: 'administrator',
  label: 'Administrator'
}, {
  value: 'skadeleder',
  label: 'Skadeleder'
}, {
  value: 'servicemedarbejder',
  label: 'Servicemedarbejder'
}];

interface EmployeeTableRowProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave?: (employee: Employee) => void;
}

const EmployeeTableRow: React.FC<EmployeeTableRowProps> = memo(({ employee, onEdit, onDelete, onToggleLeave }) => {
  const { isAdmin, isSkadeleder } = usePermissions();
  const { t } = useTranslation();

  // Get role variant for status badge
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'administrator': 
        return 'info';
      case 'skadeleder': 
        return 'success';
      default: 
        return 'default';
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
      {(isAdmin) && (
        <TableCell>
          <StatusBadge variant={getRoleVariant(employee.role)}>
            {USER_ROLES.find(role => role.value === employee.role)?.label}
          </StatusBadge>
        </TableCell>
      )}
      <TableCell>
        {employee.onLeave ? (
          <StatusBadge variant="error">
            {t('employees.onLeave')}
          </StatusBadge>
        ) : (
          <StatusBadge variant="success">
            {t('employees.available')}
          </StatusBadge>
        )}
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
