
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { Edit, Trash2, User, UserCheck } from 'lucide-react';

interface EmployeesListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave: (employee: Employee) => void;
}

const EmployeesList: React.FC<EmployeesListProps> = ({
  employees,
  onEdit,
  onDelete,
  onToggleLeave
}) => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'default';
      case 'skadeleder':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{t("employees.noEmployees")}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>{t('employees.name')}</TableHead>
            <TableHead>{t('employees.email')}</TableHead>
            <TableHead>{t('employees.phone')}</TableHead>
            <TableHead>{t('employees.role')}</TableHead>
            <TableHead>{t('employees.status')}</TableHead>
            {isAdmin && <TableHead className="text-right">{t('common.actions')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={employee.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">
                {employee.name}
                {employee.notes && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {employee.notes}
                  </div>
                )}
              </TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.phone || '-'}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(employee.role)}>
                  {t(`employees.roles.${employee.role}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {employee.onLeave ? (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {t('employees.onLeave')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {t('employees.active')}
                    </Badge>
                  )}
                </div>
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleLeave(employee)}
                      className={employee.onLeave ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"}
                    >
                      {employee.onLeave ? <UserCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(employee)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(employee)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeesList;
