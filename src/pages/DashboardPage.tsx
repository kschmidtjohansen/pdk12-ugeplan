
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { format, getISOWeek, getISOWeekYear } from 'date-fns';
import { useEnhancedUnifiedData } from '@/hooks/useEnhancedUnifiedData';
import { useVacations } from '@/hooks/useVacations';
import { AssignmentFilterService } from '@/services/assignmentFilterService';
import { getCurrentWeekDates, getCurrentWeekNumber, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/weekDates';
import { getDailyQuote } from '@/utils/dailyQuotes';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import WelcomeHeader from '@/components/Dashboard/WelcomeHeader';
import QuickAccessGrid from '@/components/Dashboard/QuickAccessGrid';
import WeeklyAssignments from '@/components/Dashboard/WeeklyAssignments';
import ServicemedarbejderDashboard from '@/components/Dashboard/ServicemedarbejderDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import { usePermissions } from '@/context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, isSkadeleder } = usePermissions();
  const { t } = useTranslation();
  
  // Use the enhanced unified data service
  const { 
    assignments: allAssignments, 
    employees,
    cars,
    loading: dataLoading, 
    error: dataErrors,
    healthCheck: isHealthy
  } = useEnhancedUnifiedData();
  
  const { vacations } = useVacations();

  const today = new Date();
  const todayISOWeek = getISOWeek(today);
  const todayISOYear = getISOWeekYear(today);
  const [selectedWeek, setSelectedWeek] = useState(todayISOWeek);
  const [selectedYear, setSelectedYear] = useState(todayISOYear);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const dailyQuote = getDailyQuote();

  console.log(`[DashboardPage] COMPREHENSIVE FIX - User: ${user?.name} (${user?.role})`);
  console.log(`[DashboardPage] COMPREHENSIVE FIX - isAdmin: ${isAdmin}, isSkadeleder: ${isSkadeleder}`);

  // Show success message when data loads successfully with better translations
  useEffect(() => {
    if (!dataLoading && !dataErrors && isHealthy && (employees.length > 0 || allAssignments.length > 0 || cars.length > 0)) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => setShowSuccessMessage(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [dataLoading, dataErrors, isHealthy, employees.length, allAssignments.length, cars.length]);

  // Get the dates for the selected week
  const weekDates = getCurrentWeekDates(selectedWeek, selectedYear);
  const startDateISO = format(weekDates.start, 'yyyy-MM-dd');
  const endDateISO = format(weekDates.end, 'yyyy-MM-dd');

  // Function to handle navigation to previous week
  const handlePreviousWeek = () => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  // Function to handle navigation to next week
  const handleNextWeek = () => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  // Filter assignments for weekly view
  const myWeekAssignments = useMemo(() => {
    const filtered = AssignmentFilterService.filterByDateRange(
      allAssignments,
      startDateISO,
      endDateISO
    );
    
    console.log(`[DashboardPage] COMPREHENSIVE FIX - Weekly assignments: ${filtered.length}`);
    return filtered;
  }, [allAssignments, startDateISO, endDateISO]);

  // Loading state with better translations
  if (dataLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-600">{t('common.loading_data')}...</p>
            <p className="text-sm text-gray-500">{t('dashboard.loadingDashboard')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Success Message with improved translations */}
        {showSuccessMessage && (
          <Alert className="border-green-200 bg-green-50 animate-fade-in-up">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium text-green-800">
                {user?.role === 'servicemedarbejder' 
                  ? t('common.system_optimized')
                  : t('common.data_loaded_successfully')
                }
              </div>
              <div className="text-sm text-green-700 mt-1">
                {user?.role === 'servicemedarbejder' 
                  ? t('common.system_optimized_description')
                  : t('common.data_loaded_description')
                }
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome Header */}
        <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />

        {/* Quick Access Grid */}
        <QuickAccessGrid userRole={user?.role} />

        {/* COMPREHENSIVE FIX: Show appropriate dashboard based on user role */}
        {(isAdmin || isSkadeleder) ? (
          <>
            {/* Dashboard Metrics for Admin/Skadeleder */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <DashboardMetrics />
            </div>

            {/* Weekly Assignments for Admin/Skadeleder */}
            <div style={{ animationDelay: '0.4s' }} className="animate-fade-in-up">
              <WeeklyAssignments
                assignments={myWeekAssignments}
                selectedWeek={selectedWeek}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
              />
            </div>
          </>
        ) : (
          /* Servicemedarbejder Dashboard with comprehensive data */
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <ServicemedarbejderDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
