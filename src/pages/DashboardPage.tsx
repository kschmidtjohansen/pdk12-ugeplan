
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
  const { user, isDemoMode, effectiveRole, userDataLoaded } = useAuth();
  const { t } = useTranslation();

  const dailyQuote = getDailyQuote();

  console.log(`[DashboardPage] ROLE-BASED - User: ${user?.name} (${user?.role}) - Effective Role: ${effectiveRole}`);

  // Check if user is servicemedarbejder for specialized dashboard
  const isServicemedarbejder = effectiveRole === 'servicemedarbejder';
  
  // Check if user should see metrics (administrators and skadeledere)
  const shouldShowMetrics = effectiveRole === 'administrator' || effectiveRole === 'skadeleder';

  // Don't render user-specific content until user data is fully loaded
  if (!userDataLoaded) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
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
