
import React from 'react';
import { usePermissions } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Mail, Phone, Trash2, UserCheck, UserX } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
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

const EmployeeTableRow: React.FC<EmployeeTableRowProps> = ({ employee, onEdit, onDelete, onToggleLeave }) => {
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

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span>{employee.name}</span>
          {employee.onLeave && (
            <StatusBadge variant="destructive">
              {t('employees.onLeave')}
            </StatusBadge>
          )}
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
      {/* Only show role to admin users */}
      {isAdmin && (
        <TableCell>
          <StatusBadge variant={getRoleVariant(employee.role)}>
            {USER_ROLES.find(role => role.value === employee.role)?.label}
          </StatusBadge>
        </TableCell>
      )}
      {isAdmin && (
        <TableCell>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(employee)} 
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">{t("common.edit")}</span>
              <Edit className="h-4 w-4" />
            </Button>
            {onToggleLeave && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onToggleLeave(employee)} 
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">
                  {employee.onLeave ? t("employees.markAvailable") : t("employees.markOnLeave")}
                </span>
                {employee.onLeave ? (
                  <UserCheck className="h-4 w-4 text-green-500" />
                ) : (
                  <UserX className="h-4 w-4 text-orange-500" />
                )}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(employee)} 
              className="h-8 w-8 p-0 text-destructive"
            >
              <span className="sr-only">{t("common.delete")}</span>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
};

export default EmployeeTableRow;
