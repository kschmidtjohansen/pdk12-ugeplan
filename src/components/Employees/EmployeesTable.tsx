import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePermissions } from '@/context/AuthContext';
import SimplePagination from '@/components/shared/SimplePagination';
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

const PAGE_SIZE = 25;
// INTENTIONAL: above this threshold the desktop table switches from
// SimplePagination to row virtualisation (TanStack Virtual).
const VIRTUALIZE_THRESHOLD = 50;
const ROW_HEIGHT = 56;

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

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [employees.length]);

  const pagedEmployees = useMemo(
    () => employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [employees, page]
  );

  const shouldVirtualize = !isMobile && employees.length > VIRTUALIZE_THRESHOLD;

  const scrollParentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? employees.length : 0,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // Show error state with retry option
  if (error) {
    return <EmployeeLoadingError error={error} onRetry={onRetry} loading={loading} />;
  }

  // Show loading state
  if (loading) {
    return <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
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
        <Users className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
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
      </div>;
  }

  // Mobile: card layout (unchanged)
  if (isMobile) {
    return (
      <div className="space-y-3 p-4">
        {pagedEmployees.map(employee => (
          <MobileEmployeeCard
            key={`${employee.id}-${employee.onLeave}-${employee.status}`}
            employee={employee}
            vacations={vacations}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleLeave={onToggleLeave}
          />
        ))}
        <SimplePagination
          page={page}
          totalPages={totalPages}
          totalItems={employees.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    );
  }

  // Desktop table header — shared between paginated and virtualised paths
  const tableHeader = (
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
  );

  // aria-rowcount = data rows + 1 header row, always reflecting full filtered total
  const ariaRowCount = employees.length + 1;

  // Virtualised desktop path — > 50 filtered rows
  if (shouldVirtualize) {
    const virtualItems = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();
    const paddingTop = virtualItems[0]?.start ?? 0;
    const paddingBottom = totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0);

    return (
      <div className="space-y-4">
        <div className="border rounded-md flex items-start gap-3 p-3">
          <Users className="h-5 w-5 text-primary mt-3 shrink-0" />
          <div className="flex-1">
            <div
              ref={scrollParentRef}
              className="max-h-[calc(100vh-260px)] overflow-auto"
            >
              <Table aria-rowcount={ariaRowCount}>
                {tableHeader}
                <TableBody>
                  {paddingTop > 0 && (
                    <tr aria-hidden="true" style={{ height: paddingTop }} />
                  )}
                  {virtualItems.map(virtualItem => {
                    const employee = employees[virtualItem.index];
                    if (!employee) return null;
                    return (
                      <EmployeeTableRow
                        key={`${employee.id}-${employee.onLeave}-${employee.status}`}
                        employee={employee}
                        vacations={vacations}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleLeave={onToggleLeave}
                        aria-rowindex={virtualItem.index + 2}
                      />
                    );
                  })}
                  {paddingBottom > 0 && (
                    <tr aria-hidden="true" style={{ height: paddingBottom }} />
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {t('employees.showingAll') || 'Viser alle'} {employees.length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Desktop paginated path — ≤ 50 filtered rows (unchanged behaviour)
  return (
    <div className="space-y-4">
      <div className="border rounded-md flex items-start gap-3 p-3">
        <Users className="h-5 w-5 text-primary mt-3 shrink-0" />
        <div className="flex-1">
          <Table aria-rowcount={ariaRowCount}>
            {tableHeader}
            <TableBody>
              {pagedEmployees.map(employee => (
                <EmployeeTableRow
                  key={`${employee.id}-${employee.onLeave}-${employee.status}`}
                  employee={employee}
                  vacations={vacations}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleLeave={onToggleLeave}
                />
              ))}
            </TableBody>
          </Table>
          <SimplePagination
            page={page}
            totalPages={totalPages}
            totalItems={employees.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeesTable;
