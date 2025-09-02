
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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-gray-50 to-background relative overflow-hidden">
      {/* Modern background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-2xl transform -translate-x-32 translate-y-32"></div>
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <Alert className="border-green-200 bg-green-50 animate-fade-in-up">
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
        {isDemoMode && (
          <div className="animate-fade-in-up">
            <DemoDashboard />
          </div>
        )}

        {/* Welcome Header */}
        <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />

        {/* Role-based Dashboard Content */}
        {isServicemedarbejder ? (
          /* Servicemedarbejder Dashboard - Specialized view */
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <ServicemedarbejderDashboard />
          </div>
        ) : (
          /* Administrator/Skadeleder Dashboard - Full view */
          <>
            {/* Quick Access Grid */}
            <QuickAccessGrid userRole={effectiveRole} />

            {/* Dashboard Metrics - Only for administrators and skadeledere */}
            {shouldShowMetrics && (
              <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <DashboardMetrics />
              </div>
            )}

            {/* Main Content - Mine Opgaver for all users */}
            <div className="animate-fade-in-up" style={{ animationDelay: shouldShowMetrics ? '0.2s' : '0.1s' }}>
              <MineOpgaver />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
