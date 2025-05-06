
import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { usePermissions } from '../../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmployeeTableRow from './EmployeeTableRow';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: string;
  onLeave?: boolean;
  notes?: string;
}

interface EmployeesListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const EmployeesList: React.FC<EmployeesListProps> = ({ employees, onEdit, onDelete }) => {
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
              {isAdmin && <TableHead>{t("employees.role")}</TableHead>}
              <TableHead>{t("employees.leaveStatus")}</TableHead>
              {isAdmin && <TableHead>{t("employees.notes")}</TableHead>}
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
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EmployeesList;
