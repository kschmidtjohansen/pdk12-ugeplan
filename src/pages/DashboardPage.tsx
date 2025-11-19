
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { getDailyQuote } from '@/utils/dailyQuotes';
import WelcomeHeader from '@/components/Dashboard/WelcomeHeader';
import QuickAccessGrid from '@/components/Dashboard/QuickAccessGrid';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import MineOpgaver from '@/components/Dashboard/MineOpgaver';
import { DemoDashboard } from '@/components/Demo/DemoDashboard';
import ServicemedarbejderDashboard from '@/components/Dashboard/ServicemedarbejderDashboard';
import { DashboardCustomizationMenu } from '@/components/Dashboard/DashboardCustomizationMenu';
import { useDashboardCustomization } from '@/hooks/useDashboardCustomization';

const DashboardPage: React.FC = () => {
  const { user, isDemoMode, effectiveRole } = useAuth();
  const { t } = useTranslation();
  const { getVisibleWidgets, layout } = useDashboardCustomization(user?.id || 'default');

  const dailyQuote = getDailyQuote();

  console.log(`[DashboardPage] ROLE-BASED - User: ${user?.name} (${user?.role}) - Effective Role: ${effectiveRole}`);

  // Check if user is servicemedarbejder for specialized dashboard
  const isServicemedarbejder = effectiveRole === 'servicemedarbejder';
  
  // Check if user should see metrics (administrators and skadeledere)
  const shouldShowMetrics = effectiveRole === 'administrator' || effectiveRole === 'skadeleder';

  const visibleWidgets = getVisibleWidgets();
  const isWidgetVisible = (widgetId: string) => visibleWidgets.some(w => w.id === widgetId);

  // Get spacing class based on grid size
  const spacingClass = {
    compact: 'space-y-4',
    comfortable: 'space-y-6',
    spacious: 'space-y-8'
  }[layout.gridSize];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className={`w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 ${spacingClass}`}>
        {/* Demo Dashboard - Only in demo mode */}
        {isDemoMode && <DemoDashboard />}

        {/* Welcome Header with Customization Menu */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />
          </div>
          {!isServicemedarbejder && (
            <DashboardCustomizationMenu userId={user?.id || 'default'} />
          )}
        </div>

        {/* Role-based Dashboard Content */}
        {isServicemedarbejder ? (
          /* Servicemedarbejder Dashboard - Specialized view */
          <ServicemedarbejderDashboard />
        ) : (
          /* Administrator/Skadeleder Dashboard - Full view with customization */
          <>
            {visibleWidgets.map(widget => {
              switch (widget.id) {
                case 'quick-access':
                  return isWidgetVisible('quick-access') && (
                    <QuickAccessGrid key="quick-access" userRole={effectiveRole} />
                  );
                case 'metrics':
                  return shouldShowMetrics && isWidgetVisible('metrics') && (
                    <DashboardMetrics key="metrics" />
                  );
                case 'mine-opgaver':
                  return isWidgetVisible('mine-opgaver') && (
                    <MineOpgaver key="mine-opgaver" />
                  );
                default:
                  return null;
              }
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
