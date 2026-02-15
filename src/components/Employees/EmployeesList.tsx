
import React from 'react';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, UserX, UserCheck, Users, RefreshCw } from 'lucide-react';
import EmployeeLoadingError from '@/components/ErrorBoundary/EmployeeLoadingError';

interface EmployeesListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave: (employee: Employee) => void;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
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

  // Show error state with retry option
  if (error) {
    return <EmployeeLoadingError error={error} onRetry={onRetry} loading={loading} />;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t('common.loading') || 'Loading employees...'}
          </span>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show empty state
  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {t('employees.noEmployees') || 'No employees found'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {t('employees.noEmployeesDescription') || 'No employee records were found in the system.'}
        </p>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.retry') || 'Retry'}
        </Button>
      </div>
    );
  }

  // Show employees list
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">
          {t('employees.title')} ({employees.length})
        </span>
      </div>
      
      {employees.map((employee) => (
        <Card key={employee.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {employee.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{employee.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {t(`employees.${employee.role}`)}
                    </Badge>
                    <Badge 
                      variant={employee.onLeave ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {employee.onLeave 
                        ? (t('employees.onLeave') || 'On Leave')
                        : (t('employees.available') || 'Available')
                      }
                    </Badge>
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => onToggleLeave(employee)}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    title={employee.onLeave 
                      ? (t('employees.markAvailable') || 'Mark Available')
                      : (t('employees.markOnLeave') || 'Mark On Leave')
                    }
                  >
                    {employee.onLeave ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => onEdit(employee)}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    title={t('common.edit') || 'Edit'}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(employee)}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    title={t('common.delete') || 'Delete'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EmployeesList;
