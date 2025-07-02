
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { getDailyQuote } from '@/utils/dailyQuotes';
import WelcomeHeader from '@/components/Dashboard/WelcomeHeader';
import QuickAccessGrid from '@/components/Dashboard/QuickAccessGrid';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import MineOpgaver from '@/components/Dashboard/MineOpgaver';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const dailyQuote = getDailyQuote();

  console.log(`[DashboardPage] SIMPLIFIED - User: ${user?.name} (${user?.role})`);

  // Check if user should see metrics (administrators and skadeledere)
  const shouldShowMetrics = user?.role === 'administrator' || user?.role === 'skadeleder';

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

        {/* Welcome Header */}
        <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />

        {/* Quick Access Grid */}
        <QuickAccessGrid userRole={user?.role} />

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
      </div>
    </div>
  );
};

export default DashboardPage;
