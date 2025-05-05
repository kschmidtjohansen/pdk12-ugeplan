
import React from 'react';
import { usePermissions } from '../../context/AuthContext';
import { useTranslation } from '../../context/TranslationContext';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Mail, Phone, Trash2 } from 'lucide-react';
import { Employee } from './EmployeesList';

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
}

const EmployeeTableRow: React.FC<EmployeeTableRowProps> = ({ employee, onEdit, onDelete }) => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();

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
      <TableCell>
        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
          employee.role === 'administrator' 
            ? 'bg-blue-100 text-blue-800' 
            : employee.role === 'skadeleder' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
        }`}>
          {USER_ROLES.find(role => role.value === employee.role)?.label}
        </span>
      </TableCell>
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
