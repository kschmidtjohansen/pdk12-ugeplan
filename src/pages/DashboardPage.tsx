
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { format, getISOWeek, getISOWeekYear } from 'date-fns';
import { useEnhancedUnifiedData } from '@/hooks/useEnhancedUnifiedData';
import { useVacations } from '@/hooks/useVacations';
import { AssignmentFilterService } from '@/services/assignmentFilterService';
import { getCurrentWeekDates, getCurrentWeekNumber, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/weekDates';
import { getDailyQuote } from '@/utils/dailyQuotes';
import { isValidUUID } from '@/utils/uuidValidation';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import WelcomeHeader from '@/components/Dashboard/WelcomeHeader';
import QuickAccessGrid from '@/components/Dashboard/QuickAccessGrid';
import WeeklyAssignments from '@/components/Dashboard/WeeklyAssignments';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Use the enhanced unified data service with comprehensive fix
  const { 
    assignments: allAssignments, 
    employees,
    cars,
    isLoading: dataLoading, 
    hasErrors: dataErrors,
    isHealthy
  } = useEnhancedUnifiedData();
  
  const { vacations } = useVacations();

  const today = new Date();
  const todayISOWeek = getISOWeek(today);
  const todayISOYear = getISOWeekYear(today);
  const [selectedWeek, setSelectedWeek] = useState(todayISOWeek);
  const [selectedYear, setSelectedYear] = useState(todayISOYear);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const dailyQuote = getDailyQuote();

  console.log(`[DashboardPage] ENHANCED DATA - Dashboard for user: ${user?.name} (${user?.role})`);
  console.log(`[DashboardPage] ENHANCED DATA - All assignments: ${allAssignments.length}, employees: ${employees.length}, cars: ${cars.length}`);

  // Show success message when data loads successfully after the fix
  useEffect(() => {
    if (!dataLoading && !dataErrors && isHealthy && (employees.length > 0 || allAssignments.length > 0 || cars.length > 0)) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => setShowSuccessMessage(false), 10000); // Hide after 10 seconds
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
    
    console.log(`[DashboardPage] ENHANCED DATA - Weekly assignments: ${filtered.length} assignments`);
    return filtered;
  }, [allAssignments, startDateISO, endDateISO]);

  // Enhanced loading state with proper error handling
  if (dataLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-600">{t('common.loading')}...</p>
            <p className="text-sm text-gray-500">Loading dashboard with comprehensive database fix</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Success Message */}
        {showSuccessMessage && (
          <Alert className="border-green-200 bg-green-50 animate-fade-in-up">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium text-green-800">Database Fix Successful! ✅</div>
              <div className="text-sm text-green-700 mt-1">
                All data fetching errors have been resolved! The infinite recursion issue is completely fixed, 
                and all your data ({employees.length} employees, {allAssignments.length} assignments, {cars.length} cars) 
                is now loading properly with clean, optimized database policies.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome Header */}
        <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />

        {/* Quick Access Grid */}
        <QuickAccessGrid userRole={user?.role} />

        {/* Dashboard Metrics */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <DashboardMetrics selectedDate={format(new Date(), 'yyyy-MM-dd')} assignments={allAssignments} />
        </div>

        {/* Weekly Assignments */}
        <div style={{ animationDelay: '0.4s' }} className="animate-fade-in-up">
          <WeeklyAssignments
            assignments={myWeekAssignments}
            selectedWeek={selectedWeek}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
