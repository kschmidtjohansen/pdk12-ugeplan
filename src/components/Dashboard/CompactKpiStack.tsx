import React, { useState } from 'react';
import { Users, Car, UserX, Package, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Card } from '@/components/ui/card';
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
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-accent/40 focus:outline-none focus-visible:bg-accent/60',
        !isLast && 'border-b border-border'
      )}
    >
      <div className={cn('h-8 w-8 rounded-md flex items-center justify-center shrink-0', accentMap[accent])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      </div>
      <div className="text-right tabular-nums">
        <span className={cn('text-xl font-semibold', accent === 'primary' ? 'text-primary' : 'text-foreground')}>
          {value}
        </span>
        {total !== undefined && (
          <span className="text-xs text-muted-foreground ml-0.5">/ {total}</span>
        )}
      </div>
    </button>
  );
};

interface CompactKpiStackProps {
  /** ISO yyyy-MM-dd. Defaults to today. */
  selectedDate?: string;
}

const CompactKpiStack: React.FC<CompactKpiStackProps> = ({ selectedDate }) => {
  const { metrics, loading, error, assignments, vacations } = useDashboardMetrics();
  const { t } = useTranslation();
  const { isWarehouseEnabled } = useDepartment();
  const navigate = useNavigate();
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [absentModalOpen, setAbsentModalOpen] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const effectiveDate = selectedDate || todayStr;

  if (loading) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="px-4 pt-3 brand-card-header">
          <h3 className="text-sm font-semibold brand-dot">{t('dashboard.metrics.title') || 'Nøgletal'}</h3>
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
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-0 overflow-hidden border-destructive/30 bg-destructive/5">
        <div className="px-4 py-3 border-b border-destructive/30">
          <h3 className="text-sm font-semibold text-destructive">{t('dashboard.metrics.title')}</h3>
        </div>
        <div className="px-4 py-6 text-sm text-destructive">
          {t('common.errorLoadingData')}
        </div>
      </Card>
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
      <Card className="p-0 overflow-hidden">
        <div className="px-4 pt-3 brand-card-header">
          <h3 className="text-sm font-semibold brand-dot text-foreground">
            {t('dashboard.metrics.title') || 'Nøgletal'}
          </h3>
        </div>
        <div>
          {rows.map((r, i) => (
            <KpiRow key={r.key} {...r} isLast={i === rows.length - 1} />
          ))}
        </div>
      </Card>

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
