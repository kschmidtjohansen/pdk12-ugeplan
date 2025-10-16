
import React, { useState } from 'react';
import { Users, Car, UserX, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import InteractiveMetricCard from './InteractiveMetricCard';
import EmployeeAvailabilityDialog from './EmployeeAvailabilityDialog';
import CarAvailabilityModal from './CarAvailabilityModal';
import AbsentEmployeesModal from './AbsentEmployeesModal';
import { format } from 'date-fns';

const DashboardMetrics: React.FC = () => {
  const { metrics, loading, error, assignments, vacations } = useDashboardMetrics();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [absentModalOpen, setAbsentModalOpen] = useState(false);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  if (loading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (error) {
    return (
      <EmptyState
        title={t('common.error')}
        description={error}
        action={{
          label: t('common.retry'),
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <InteractiveMetricCard
          title={t('dashboard.metrics.availableEmployees')}
          value={metrics.availableEmployees.count}
          total={metrics.availableEmployees.total}
          subtitle={t('dashboard.metrics.availableEmployeesDesc')}
          icon={Users}
          color="green"
          onClick={() => setEmployeeModalOpen(true)}
        />
        
        <InteractiveMetricCard
          title={t('dashboard.metrics.availableCars')}
          value={metrics.availableCars.count}
          total={metrics.availableCars.total}
          subtitle={t('dashboard.metrics.availableCarsDesc')}
          icon={Car}
          color="blue"
          onClick={() => setCarModalOpen(true)}
        />
        
        <InteractiveMetricCard
          title={t('dashboard.metrics.absentEmployees')}
          value={metrics.absentEmployees.count}
          subtitle={t('dashboard.metrics.absentEmployeesDesc')}
          icon={UserX}
          color="red"
          onClick={() => setAbsentModalOpen(true)}
        />
        
        <InteractiveMetricCard
          title={t('dashboard.metrics.warehouseItems')}
          value={metrics.warehouseItems.count}
          subtitle={t('dashboard.metrics.warehouseItemsDesc')}
          icon={Package}
          color="orange"
          onClick={() => navigate('/warehouse')}
        />
      </div>

      {/* Detail Modals */}
      <EmployeeAvailabilityDialog
        open={employeeModalOpen}
        onOpenChange={setEmployeeModalOpen}
        employees={metrics.availableEmployees.employees}
        assignments={assignments}
        vacations={vacations}
        selectedDate={todayStr}
        title={t('dashboard.metrics.availableEmployeesDetails')}
      />
      
      <CarAvailabilityModal
        isOpen={carModalOpen}
        onClose={() => setCarModalOpen(false)}
        cars={metrics.availableCars.cars}
        title={t('dashboard.metrics.availableCarsDetails')}
      />
      
      <AbsentEmployeesModal
        isOpen={absentModalOpen}
        onClose={() => setAbsentModalOpen(false)}
        employees={metrics.absentEmployees.employees}
        title={t('dashboard.metrics.absentEmployeesDetails')}
      />
    </>
  );
};

export default DashboardMetrics;
