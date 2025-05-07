
import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { usePermissions } from '../../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmployeeTableRow from './EmployeeTableRow';
import { Employee } from '@/types/employee';

interface EmployeesListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave?: (employee: Employee) => void;
}

const EmployeesList: React.FC<EmployeesListProps> = ({ employees, onEdit, onDelete, onToggleLeave }) => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("employees.name")}</TableHead>
              <TableHead>{t("employees.contactInfo")}</TableHead>
              <TableHead>{t("employees.jobTitle")}</TableHead>
              {/* Only show role column to admins */}
              {isAdmin && <TableHead>{t("employees.role")}</TableHead>}
              {isAdmin && <TableHead className="w-[100px]">{t("common.actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map(employee => (
              <EmployeeTableRow 
                key={employee.id} 
                employee={employee}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleLeave={onToggleLeave}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EmployeesList;
