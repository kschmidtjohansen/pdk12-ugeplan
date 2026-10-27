import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePermissions } from '@/context/AuthContext';
import SimplePagination from '@/components/shared/SimplePagination';
import { useTranslation } from '@/context/TranslationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import EmployeeTableRow from './EmployeeTableRow';
import MobileEmployeeCard from './MobileEmployeeCard';
import EmployeeLoadingError from '@/components/ErrorBoundary/EmployeeLoadingError';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';

interface EmployeesTableProps {
  employees: Employee[];
  isFiltered?: boolean;
  onResetFilters?: () => void;
  vacations: Vacation[];
  trainingIds?: Set<string>;
  sickIds?: Set<string>;
  canSeeSickReason?: boolean;
  onToggleSick?: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onToggleLeave: (employee: Employee) => void;
  onTraining?: (employee: Employee) => void;
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
  isFiltered = false,
  onResetFilters,
  vacations,
  trainingIds,
  sickIds,
  canSeeSickReason,
  onToggleSick,
  onEdit,
  onDelete,
  onToggleLeave,
  onTraining,
  error,
  loading,
  onRetry
}) => {
  const { isAdmin } = usePermissions();
  const { t, currentLanguage } = useTranslation();
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

  const shouldVirtualize = !isMobile && employees.length >= VIRTUALIZE_THRESHOLD;

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
    return <div className="p-3" role="status" aria-live="polite" aria-label={currentLanguage === 'da' ? 'Indlæser medarbejdere' : 'Loading employees'}><ListSkeleton /></div>;
  }

  // Show empty state
  if (employees.length === 0) {
    return <div className="p-4" data-testid={isFiltered ? 'employees-empty-filtered' : 'employees-empty'}><EmptyState icon={<Users className="h-8 w-8 text-muted-foreground" />}
      title={isFiltered ? (currentLanguage === 'da' ? 'Ingen medarbejdere matcher' : 'No matching employees') : t('employees.noEmployees')}
      description={isFiltered ? (currentLanguage === 'da' ? 'Prøv en anden status eller søgning.' : 'Try another status or search.') : t('employees.noEmployeesDescription')}
      action={isFiltered && onResetFilters ? { label: currentLanguage === 'da' ? 'Ryd filtre' : 'Clear filters', onClick: onResetFilters } : undefined} /></div>;
  }

  // Mobile: divided card list inside the workspace (no card-in-card)
  if (isMobile) {
    return (
      <div className="min-w-0">
        <ul className="divide-y divide-border" aria-label={t('navigation.employees')}>
        {pagedEmployees.map(employee => (
          <li key={`${employee.id}-${employee.onLeave}-${employee.status}`}>
          <MobileEmployeeCard
            employee={employee}
            vacations={vacations}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleLeave={onToggleLeave}
                onTraining={onTraining}
                isOnTraining={trainingIds?.has(employee.id) ?? false}
                isSick={sickIds?.has(employee.id) ?? false}
                canSeeSickReason={canSeeSickReason}
                onToggleSick={onToggleSick}
          />
          </li>
        ))}
        </ul>
        <div className="px-3 pb-3">
        <SimplePagination
          page={page}
          totalPages={totalPages}
          totalItems={employees.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
        </div>
      </div>
    );
  }

  // Desktop table header — shared between paginated and virtualised paths
  const tableHeader = (
    <TableHeader className="sticky top-0 z-10 bg-muted/60 [&_th]:h-9 [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground">
      <TableRow className="hover:bg-transparent">
        <TableHead>{t('employees.name') || 'Name'}</TableHead>
        <TableHead>{t('employees.contact') || 'Contact'}</TableHead>
        <TableHead>{t('employees.jobTitle') || 'Job Title'}</TableHead>
        <TableHead>{t('employees.certificates') || 'Certificates'}</TableHead>
        {isAdmin && <TableHead>{t('employees.role') || 'Role'}</TableHead>}
        <TableHead>{t('employees.statusLabel') || 'Status'}</TableHead>
        {isAdmin && <TableHead className="text-right">{t('common.actions') || 'Actions'}</TableHead>}
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
        <div className="min-w-0">
          <div className="min-w-0">
            <div
              ref={scrollParentRef}
              className="max-h-[calc(100vh-260px)] overflow-auto"
            >
              <Table aria-label={t('navigation.employees')} aria-rowcount={ariaRowCount}>
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
                onTraining={onTraining}
                isOnTraining={trainingIds?.has(employee.id) ?? false}
                isSick={sickIds?.has(employee.id) ?? false}
                canSeeSickReason={canSeeSickReason}
                onToggleSick={onToggleSick}
                        
                      />
                    );
                  })}
                  {paddingBottom > 0 && (
                    <tr aria-hidden="true" style={{ height: paddingBottom }} />
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground tabular-nums">
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
      <div className="min-w-0">
        <div className="min-w-0 overflow-x-auto">
          <Table aria-label={t('navigation.employees')} aria-rowcount={ariaRowCount}>
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
                onTraining={onTraining}
                isOnTraining={trainingIds?.has(employee.id) ?? false}
                isSick={sickIds?.has(employee.id) ?? false}
                canSeeSickReason={canSeeSickReason}
                onToggleSick={onToggleSick}
                />
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-2">
            <SimplePagination
              page={page}
              totalPages={totalPages}
              totalItems={employees.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesTable;
