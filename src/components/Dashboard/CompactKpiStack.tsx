import React, { useState } from 'react';
import { Users, Car, UserX, Package, ArrowUpRight, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Button } from '@/components/ui/button';
import EmployeeAvailabilityDialog from './EmployeeAvailabilityDialog';
import CarAvailabilityModal from './CarAvailabilityModal';
import AbsentEmployeesModal from './AbsentEmployeesModal';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface KpiRowProps {
  label: string;
  value: number;
  total?: number;
  icon: LucideIcon;
  onClick: () => void;
  accent?: 'primary' | 'success' | 'warning' | 'destructive';
  isLast?: boolean;
}

const KpiRow: React.FC<KpiRowProps> = ({ label, value, total, icon: Icon, onClick, accent = 'primary', isLast }) => {
  const accentMap = {
    primary: 'text-info-soft-foreground', success: 'text-success-soft-foreground',
    warning: 'text-warning-soft-foreground', destructive: 'text-destructive-soft-foreground',
  };
  return (
    <Button variant="ghost" onClick={onClick}
      aria-label={`${label}: ${value}${total !== undefined ? ` / ${total}` : ''}`}
      className={cn('grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 w-full h-auto min-h-20 rounded-none px-0 py-4 text-left whitespace-normal', !isLast && 'border-b border-border')}>
      <span className="flex min-w-0 items-start gap-2">
        <Icon aria-hidden className={cn('mt-0.5 h-4 w-4 shrink-0', accentMap[accent])} />
        <span className="text-xs font-medium leading-snug text-foreground">{label}</span>
      </span>
      <ArrowUpRight aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="col-span-2 flex items-baseline gap-1 pl-6 tabular-nums">
        <span className="text-3xl font-semibold leading-none text-foreground">{value}</span>
        {total !== undefined && <span className="text-sm text-muted-foreground">/ {total}</span>}
      </span>
    </Button>
  );
};

interface CompactKpiStackProps {
  /** ISO yyyy-MM-dd. Defaults to today. */
  selectedDate?: string;
  /** Optional ISO yyyy-MM-dd week range; expands kursus-tjek til hele ugen. */
  weekRange?: { startStr: string; endStr: string };
}

const CompactKpiStack: React.FC<CompactKpiStackProps> = ({ selectedDate, weekRange }) => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const effectiveDate = selectedDate || todayStr;
  const { metrics, loading, error, assignments, vacations } = useDashboardMetrics(effectiveDate, weekRange);
  const { t } = useTranslation();
  const { isWarehouseEnabled } = useDepartment();
  const navigate = useNavigate();
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [absentModalOpen, setAbsentModalOpen] = useState(false);

  if (loading) {
    return (
      <section aria-busy={loading} className="rounded-lg border border-border border-l-[3px] border-l-info-soft-foreground bg-info-soft/40 p-4">
        <div className="pb-3 border-b border-border">
          <h3 className="text-sm font-semibold">{t('dashboard.metrics.title') || 'Nøgletal'}</h3>
        </div>
        <div className="divide-y divide-border">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 px-4 flex items-center">
              <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
              <div className="flex-1 ml-3 h-3 bg-muted rounded animate-pulse" />
              <div className="h-5 w-8 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section role="alert" className="rounded-lg border border-border border-l-[3px] border-l-info-soft-foreground bg-info-soft/40 p-4">
        <div className="py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-destructive">{t('dashboard.metrics.title')}</h3>
        </div>
        <div className="py-6 text-sm text-destructive">
          {t('common.errorLoadingData')}
        </div>
      </section>
    );
  }

  const rows: Array<KpiRowProps & { key: string }> = [
    {
      key: 'employees',
      label: t('dashboard.metrics.availableEmployees'),
      value: metrics.availableEmployees.count,
      total: metrics.availableEmployees.total,
      icon: Users,
      onClick: () => setEmployeeModalOpen(true),
      accent: 'success',
    },
    {
      key: 'cars',
      label: t('dashboard.metrics.availableCars'),
      value: metrics.availableCars.count,
      total: metrics.availableCars.total,
      icon: Car,
      onClick: () => setCarModalOpen(true),
      accent: 'primary',
    },
    {
      key: 'absent',
      label: t('dashboard.metrics.absentEmployees'),
      value: metrics.absentEmployees.count,
      icon: UserX,
      onClick: () => setAbsentModalOpen(true),
      accent: 'destructive',
    },
  ];

  if (isWarehouseEnabled) {
    rows.push({
      key: 'warehouse',
      label: t('dashboard.metrics.warehouseItems'),
      value: metrics.warehouseItems.count,
      icon: Package,
      onClick: () => navigate('/warehouse'),
      accent: 'warning',
    });
  }

  return (
    <>
      <section aria-busy={loading} className="rounded-lg border border-border border-l-[3px] border-l-info-soft-foreground bg-info-soft/40 p-4">
        <div className="pb-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {t('dashboard.metrics.title') || 'Nøgletal'}
          </h3>
        </div>
        <div>
          {rows.map(({ key, ...row }, i) => (
            <KpiRow key={key} {...row} isLast={i === rows.length - 1} />
          ))}
        </div>
      </section>

      <EmployeeAvailabilityDialog
        open={employeeModalOpen}
        onOpenChange={setEmployeeModalOpen}
        employees={metrics.availableEmployees.employees}
        selectedDate={effectiveDate}
        assignments={assignments}
        vacations={vacations}
        title={t('dashboard.metrics.availableEmployees')}
      />
      <CarAvailabilityModal
        isOpen={carModalOpen}
        onClose={() => setCarModalOpen(false)}
        cars={metrics.availableCars.cars}
        title={t('dashboard.metrics.availableCars')}
        selectedDate={effectiveDate}
      />
      <AbsentEmployeesModal
        isOpen={absentModalOpen}
        onClose={() => setAbsentModalOpen(false)}
        employees={metrics.absentEmployees.employees}
        title={t('dashboard.metrics.absentEmployees')}
        selectedDate={effectiveDate}
      />
    </>
  );
};

export default CompactKpiStack;
