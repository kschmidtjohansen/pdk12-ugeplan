
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
    <div className="page-layout">
      <div className="page-content">
        {/* Success Message */}
        {showSuccessMessage && (
          <Alert className="glass-effect-subtle border-success/30 bg-success/10 animate-fade-in-up">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <AlertDescription>
              <div className="font-semibold text-success">
                {t('common.system_optimized')}
              </div>
              <div className="text-sm text-success/80 mt-1">
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
        <div className="animate-fade-in-up">
          <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />
        </div>

        {/* Role-based Dashboard Content */}
        {isServicemedarbejder ? (
          /* Servicemedarbejder Dashboard - Specialized view */
          <div className="animate-slide-in-right" style={{ animationDelay: '0.15s' }}>
            <ServicemedarbejderDashboard />
          </div>
        ) : (
          /* Administrator/Skadeleder Dashboard - Full view */
          <div className="space-y-fluid">
            {/* Quick Access Grid */}
            <div className="animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              <QuickAccessGrid userRole={effectiveRole} />
            </div>

            {/* Dashboard Metrics - Only for administrators and skadeledere */}
            {shouldShowMetrics && (
              <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <DashboardMetrics />
              </div>
            )}

            {/* Main Content - Mine Opgaver for all users */}
            <div className="animate-slide-in-right" style={{ animationDelay: shouldShowMetrics ? '0.3s' : '0.2s' }}>
              <MineOpgaver />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
