
import React from 'react';
import { usePermissions } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Mail, Phone, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Employee } from './EmployeesList';
import { Vacation } from '@/types/vacation';
import { isWithinInterval } from 'date-fns';

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
  vacations?: Vacation[];
}

const EmployeeTableRow: React.FC<EmployeeTableRowProps> = ({ 
  employee, 
  onEdit, 
  onDelete,
  vacations = [] 
}) => {
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

  // Check if employee is currently on approved vacation
  const isOnVacation = () => {
    if (!vacations || vacations.length === 0) return false;
    
    const today = new Date();
    return vacations.some(
      (vacation) =>
        vacation.employeeId === employee.id &&
        vacation.status === 'approved' &&
        isWithinInterval(today, {
          start: vacation.startDate,
          end: vacation.endDate
        })
    );
  };

  // Get status for the employee
  const getEmployeeStatus = () => {
    if (employee.onLeave) {
      return {
        variant: 'destructive' as const,
        text: t("employees.onLeave")
      };
    } else if (isOnVacation()) {
      return {
        variant: 'warning' as const,
        text: t("planner.onVacation")
      };
    } else {
      return {
        variant: 'success' as const,
        text: t("employees.available")
      };
    }
  };

  const status = getEmployeeStatus();

  return (
    <TableRow>
      <TableCell className="font-medium">{employee.name}</TableCell>
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
      {isAdmin && (
        <TableCell>
          <StatusBadge variant={getRoleVariant(employee.role)}>
            {USER_ROLES.find(role => role.value === employee.role)?.label}
          </StatusBadge>
        </TableCell>
      )}
      <TableCell>
        <StatusBadge variant={status.variant}>
          {status.text}
        </StatusBadge>
      </TableCell>
      {(isAdmin || isSkadeleder) && (
        <TableCell>
          {employee.notes || '-'}
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
