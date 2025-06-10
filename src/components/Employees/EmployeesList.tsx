
import React from 'react';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmployeeTableRow from './EmployeeTableRow';
import EmployeeDataErrorBoundary from '../ErrorBoundary/EmployeeDataErrorBoundary';

interface EmployeesListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave: (employee: Employee) => void;
  error?: string | null;
  loading?: boolean;
  onRetry?: () => void;
}

const EmployeesList: React.FC<EmployeesListProps> = ({
  employees,
  onEdit,
  onDelete,
  onToggleLeave,
  error,
  loading,
  onRetry
}) => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();

  // Show error boundary if there's an error
  if (error && onRetry) {
    return (
      <EmployeeDataErrorBoundary
        error={error}
        onRetry={onRetry}
        loading={loading || false}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-polygon-blue"></div>
      </div>
    );
  }

  // Show empty state
  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">{t('employees.noEmployees')}</p>
        {isAdmin && (
          <Button onClick={() => onEdit({} as Employee)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('employees.addEmployee')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('employees.name')}</TableHead>
            <TableHead>{t('employees.email')}</TableHead>
            <TableHead>{t('employees.jobTitle')}</TableHead>
            <TableHead>{t('employees.role')}</TableHead>
            <TableHead>{t('employees.status')}</TableHead>
            {isAdmin && <TableHead className="text-right">{t('employees.actions')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
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
    </div>
  );
};

export default EmployeesList;
