
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { format, getISOWeek, getISOWeekYear } from 'date-fns';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import { useVacations } from '@/hooks/useVacations';
import { AssignmentFilterService } from '@/services/assignmentFilterService';
import { getCurrentWeekDates, getCurrentWeekNumber, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/weekDates';
import { getDailyQuote } from '@/utils/dailyQuotes';
import { isValidUUID } from '@/utils/uuidValidation';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import WelcomeHeader from '@/components/Dashboard/WelcomeHeader';
import QuickAccessGrid from '@/components/Dashboard/QuickAccessGrid';
import WeeklyAssignments from '@/components/Dashboard/WeeklyAssignments';
import DataHealthMonitor from '@/components/DataHealthMonitor';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Use the new unified data service
  const { 
    assignments: allAssignments, 
    employees,
    cars,
    isLoading: dataLoading, 
    hasErrors: dataErrors 
  } = useUnifiedData();
  
  const { vacations } = useVacations();

  const today = new Date();
  const todayISOWeek = getISOWeek(today);
  const todayISOYear = getISOWeekYear(today);
  const [selectedWeek, setSelectedWeek] = useState(todayISOWeek);
  const [selectedYear, setSelectedYear] = useState(todayISOYear);

  const dailyQuote = getDailyQuote();

  console.log(`[DashboardPage] UNIFIED DATA - Dashboard for user: ${user?.name} (${user?.role})`);
  console.log(`[DashboardPage] UNIFIED DATA - All assignments: ${allAssignments.length}, employees: ${employees.length}, cars: ${cars.length}`);

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
    
    console.log(`[DashboardPage] UNIFIED DATA - Weekly assignments: ${filtered.length} assignments`);
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
            <p className="text-sm text-gray-500">Loading dashboard data with improved system</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Welcome Header */}
        <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />

        {/* Data Health Monitor - Show if there are errors */}
        {dataErrors && (
          <div className="animate-fade-in-up">
            <DataHealthMonitor showInDashboard={true} />
          </div>
        )}

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
