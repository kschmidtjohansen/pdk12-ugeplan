
import React, { useState, useEffect } from 'react';
import { Users, Car, UserX, Package, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import MetricsSkeleton from '@/components/shared/MetricsSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import InteractiveMetricCard from './InteractiveMetricCard';
import EmployeeAvailabilityDialog from './EmployeeAvailabilityDialog';
import CarAvailabilityModal from './CarAvailabilityModal';
import AbsentEmployeesModal from './AbsentEmployeesModal';
import DutySummaryWidget from './DutySummaryWidget';
import { format } from 'date-fns';

const DashboardMetrics: React.FC = () => {
  const { metrics, loading, error, assignments, vacations } = useDashboardMetrics();
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();
  const navigate = useNavigate();
  
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [absentModalOpen, setAbsentModalOpen] = useState(false);
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('dashboardMetricsCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('dashboardMetricsCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  if (loading) {
    return <MetricsSkeleton count={5} />;
  }
  
  // Only show error alert for production mode, not demo mode
  if (error && !isDemoMode) {
    return (
      <Alert variant="destructive" className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('dashboard.systemErrorTitle')}: {t('dashboard.systemErrorDescription')}
          </AlertDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="ml-4 shrink-0"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.refresh')}
        </Button>
      </Alert>
    );
  }
  return (
    <>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl font-bold">System Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          
          <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

              <DutySummaryWidget />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
