
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { getDailyQuote } from '@/utils/dailyQuotes';
import WelcomeHeader from '@/components/Dashboard/WelcomeHeader';
import QuickAccessGrid from '@/components/Dashboard/QuickAccessGrid';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import MineOpgaver from '@/components/Dashboard/MineOpgaver';
import { DemoDashboard } from '@/components/Demo/DemoDashboard';
import ServicemedarbejderDashboard from '@/components/Dashboard/ServicemedarbejderDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user, isDemoMode, effectiveRole } = useAuth();
  const { t } = useTranslation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const dailyQuote = getDailyQuote();

  console.log(`[DashboardPage] ROLE-BASED - User: ${user?.name} (${user?.role}) - Effective Role: ${effectiveRole}`);

  // Check if user is servicemedarbejder for specialized dashboard
  const isServicemedarbejder = effectiveRole === 'servicemedarbejder';
  
  // Check if user should see metrics (administrators and skadeledere)
  const shouldShowMetrics = effectiveRole === 'administrator' || effectiveRole === 'skadeleder';

  // Show success message briefly
  useEffect(() => {
    setShowSuccessMessage(true);
    const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Success Message */}
        {showSuccessMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium text-green-800">
                {t('common.system_optimized')}
              </div>
              <div className="text-sm text-green-700 mt-1">
                {t('common.system_optimized_description')}
              </div>
            </AlertDescription>
          </Alert>
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
            {/* Quick Access Grid */}
            <QuickAccessGrid userRole={effectiveRole} />

            {/* Dashboard Metrics - Only for administrators and skadeledere */}
            {shouldShowMetrics && <DashboardMetrics />}

            {/* Main Content - Mine Opgaver for all users */}
            <MineOpgaver />
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
