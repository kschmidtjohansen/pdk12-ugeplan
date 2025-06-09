
import React from 'react';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left p-4 font-medium text-gray-700">
              {t('employees.name')}
            </th>
            <th className="text-left p-4 font-medium text-gray-700">
              {t('employees.email')}
            </th>
            <th className="text-left p-4 font-medium text-gray-700">
              {t('employees.jobTitle')}
            </th>
            <th className="text-left p-4 font-medium text-gray-700">
              {t('employees.role')}
            </th>
            <th className="text-left p-4 font-medium text-gray-700">
              {t('employees.status')}
            </th>
            {isAdmin && (
              <th className="text-right p-4 font-medium text-gray-700">
                {t('common.actions')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <EmployeeTableRow
              key={employee.id}
              employee={employee}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleLeave={onToggleLeave}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeesList;
