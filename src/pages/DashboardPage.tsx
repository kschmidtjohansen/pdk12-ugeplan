
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

  console.log(`[DashboardPage] ROLE-BASED - User: ${user?.name} (${user?.role}) - Effective Role: ${effectiveRole}`);

  // Check if user is servicemedarbejder for specialized dashboard
  const isServicemedarbejder = effectiveRole === 'servicemedarbejder';
  
  // Check if user should see metrics (administrators and skadeledere)
  const shouldShowMetrics = effectiveRole === 'super_admin' || effectiveRole === 'administrator' || effectiveRole === 'skadeleder';

  return (
    <DataFetchErrorBoundary>
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen w-full bg-muted/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
          {/* Last Refresh Indicator */}
          {!isServicemedarbejder && (
            <div className="flex justify-end">
              <LastRefreshIndicator 
                lastRefresh={lastRefresh}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            </div>
          )}

          {/* Demo Dashboard - Only in demo mode */}
          {isDemoMode && <DemoDashboard />}

          {/* Welcome Header */}
          <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />

          {/* Role-based Dashboard Content */}
          {isServicemedarbejder ? (
            /* Servicemedarbejder Dashboard - Specialized view */
            <ServicemedarbejderDashboard />
          ) : (
            /* Administrator/Skadeleder Dashboard - Full view */
            <>
              <QuickAccessGrid userRole={effectiveRole} />
              {shouldShowMetrics && <DashboardMetrics />}
              {isUserInSelectedDepartment && <MineOpgaver />}
            </>
          )}
        </div>
      </div>
    </PullToRefresh>
    </DataFetchErrorBoundary>
  );
};

export default DashboardPage;
