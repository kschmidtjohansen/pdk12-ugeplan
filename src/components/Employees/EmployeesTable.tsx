import React from 'react';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmployeeTableRow from './EmployeeTableRow';
import MobileEmployeeCard from './MobileEmployeeCard';
import EmployeeLoadingError from '@/components/ErrorBoundary/EmployeeLoadingError';
interface EmployeesTableProps {
  employees: Employee[];
  vacations: Vacation[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave: (employee: Employee) => void;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}
const EmployeesTable: React.FC<EmployeesTableProps> = ({
  employees,
  vacations,
  onEdit,
  onDelete,
  onToggleLeave,
  error,
  loading,
  onRetry
}) => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Show error state with retry option
  if (error) {
    return <EmployeeLoadingError error={error} onRetry={onRetry} loading={loading} />;
  }

  // Show loading state
  if (loading) {
    return <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            {t('common.loading') || 'Loading employees...'}
          </span>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead>{t('employees.name') || 'Name'}</TableHead>
                  <TableHead>{t('employees.contact') || 'Contact'}</TableHead>
                  <TableHead>{t('employees.jobTitle') || 'Job Title'}</TableHead>
                  {isAdmin && <TableHead>{t('employees.role') || 'Role'}</TableHead>}
                  <TableHead>{t('employees.statusLabel') || 'Status'}</TableHead>
                  {isAdmin && <TableHead>{t('common.actions') || 'Actions'}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({
              length: 6
            }).map((_, i) => <TableRow key={i}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                  {isAdmin && <td className="p-4"><Skeleton className="h-8 w-24" /></td>}
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </div>;
  }

  // Show empty state
  if (employees.length === 0) {
    return <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          {t('employees.noEmployees') || 'No employees found'}
        </h3>
        <p className="text-gray-500 mb-4">
          {t('employees.noEmployeesDescription') || 'No employee records were found in the system.'}
        </p>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.retry') || 'Retry'}
        </Button>
      </div>;
  }

  // Mobile: card layout
  if (isMobile) {
    return (
      <div className="space-y-3 p-4">
        {employees.map(employee => (
          <MobileEmployeeCard
            key={`${employee.id}-${employee.onLeave}-${employee.status}`}
            employee={employee}
            vacations={vacations}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleLeave={onToggleLeave}
          />
        ))}
      </div>
    );
  }

  // Desktop: table layout
  return <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('employees.name') || 'Name'}</TableHead>
              <TableHead>{t('employees.contact') || 'Contact'}</TableHead>
              <TableHead>{t('employees.jobTitle') || 'Job Title'}</TableHead>
              <TableHead>{t('employees.certificates') || 'Certificates'}</TableHead>
              
              {isAdmin && <TableHead>{t('employees.role') || 'Role'}</TableHead>}
              <TableHead>{t('employees.statusLabel') || 'Status'}</TableHead>
              {isAdmin && <TableHead>{t('common.actions') || 'Actions'}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map(employee => <EmployeeTableRow key={`${employee.id}-${employee.onLeave}-${employee.status}`} employee={employee} vacations={vacations} onEdit={onEdit} onDelete={onDelete} onToggleLeave={onToggleLeave} />)}
          </TableBody>
        </Table>
      </div>
    </div>;
};
export default EmployeesTable;