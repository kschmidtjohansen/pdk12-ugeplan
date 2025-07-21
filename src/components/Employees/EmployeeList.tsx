
import React from 'react';
import { Employee } from '@/types/employee';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave: (employee: Employee) => void;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  onEdit,
  onDelete,
  onToggleLeave,
  error,
  loading,
  onRetry
}) => {
  const { t } = useTranslation();
  const { isAdmin } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>{t('common.error')}: {error}</span>
            <Button onClick={onRetry} variant="outline" size="sm">
              {t('common.retry')}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">{t('employees.noEmployees')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {employees.map((employee) => (
        <div
          key={employee.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{employee.name}</h3>
              <Badge variant={employee.onLeave ? "destructive" : "default"}>
                {employee.onLeave ? t('employees.onLeave') : t('employees.available')}
              </Badge>
              <Badge variant="outline">
                {t(`employees.${employee.role}`)}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{employee.email}</p>
            {employee.phone && (
              <p className="text-sm text-gray-600">{employee.phone}</p>
            )}
            {employee.jobTitle && (
              <p className="text-sm text-gray-600">{employee.jobTitle}</p>
            )}
            {employee.notes && (
              <p className="text-sm text-gray-500 mt-1">{employee.notes}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleLeave(employee)}
                >
                  {employee.onLeave ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      {t('employees.markAvailable')}
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4 mr-1" />
                      {t('employees.markOnLeave')}
                    </>
                  )}
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
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployeeList;
