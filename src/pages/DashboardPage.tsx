
import React from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { getDailyQuote } from '@/utils/dailyQuotes';
import WelcomeHeader from '@/components/Dashboard/WelcomeHeader';
import QuickAccessGrid from '@/components/Dashboard/QuickAccessGrid';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import MineOpgaver from '@/components/Dashboard/MineOpgaver';
import { DemoDashboard } from '@/components/Demo/DemoDashboard';
import ServicemedarbejderDashboard from '@/components/Dashboard/ServicemedarbejderDashboard';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { useEnhancedUnifiedData } from '@/hooks/useEnhancedUnifiedData';
import { useDepartment } from '@/context/DepartmentContext';
import { LastRefreshIndicator } from '@/components/shared/LastRefreshIndicator';
import { useState } from 'react';

const DashboardPage: React.FC = () => {
  const { user, isDemoMode, effectiveRole } = useAuth();
  const { t } = useTranslation();
  const { refetch, lastRefresh } = useEnhancedUnifiedData();
  const { isUserInSelectedDepartment } = useDepartment();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dailyQuote = getDailyQuote();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const isServicemedarbejder = effectiveRole === 'servicemedarbejder';
  const shouldShowMetrics = effectiveRole === 'super_admin' || effectiveRole === 'administrator' || effectiveRole === 'skadeleder';

  return (
    <DataFetchErrorBoundary>
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {!isServicemedarbejder && (
          <div className="flex justify-end">
            <LastRefreshIndicator lastRefresh={lastRefresh} isRefreshing={isRefreshing} onRefresh={handleRefresh} />
          </div>
        )}

        {isDemoMode && <DemoDashboard />}

        <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />

        {isServicemedarbejder ? (
          <ServicemedarbejderDashboard />
        ) : (
          <>
            <QuickAccessGrid userRole={effectiveRole} />
            {shouldShowMetrics && <DashboardMetrics />}
            {isUserInSelectedDepartment && <MineOpgaver />}
          </>
        )}
      </div>
    </PullToRefresh>
    </DataFetchErrorBoundary>
  );
};

export default DashboardPage;
