
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { format, getISOWeek, getISOWeekYear } from 'date-fns';
import { useSimpleAssignments } from '@/hooks/useSimpleAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { AssignmentFilterService } from '@/services/assignmentFilterService';
import { getCurrentWeekDates, getCurrentWeekNumber, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/weekDates';
import { getDailyQuote } from '@/utils/dailyQuotes';
import { isValidUUID } from '@/utils/uuidValidation';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import WelcomeHeader from '@/components/Dashboard/WelcomeHeader';
import QuickAccessGrid from '@/components/Dashboard/QuickAccessGrid';
import WeeklyAssignments from '@/components/Dashboard/WeeklyAssignments';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Simplified data fetching - no more complex optimization layers
  const { assignments: allAssignments, loading: assignmentsLoading, error: assignmentsError } = useSimpleAssignments();
  const { employees, updateEmployeeLeaveStatusFromVacations } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();

  const today = new Date();
  const todayISOWeek = getISOWeek(today);
  const todayISOYear = getISOWeekYear(today);
  const [selectedWeek, setSelectedWeek] = useState(todayISOWeek);
  const [selectedYear, setSelectedYear] = useState(todayISOYear);

  const dailyQuote = getDailyQuote();

  console.log(`[DashboardPage] SIMPLIFIED - Dashboard for user: ${user?.name} (${user?.role})`);
  console.log(`[DashboardPage] SIMPLIFIED - All assignments: ${allAssignments.length}`);

  useEffect(() => {
    const updateEmployeeStatuses = async () => {
      try {
        if (user?.id && isValidUUID(user.id)) {
          await updateEmployeeLeaveStatusFromVacations();
        }
      } catch (error) {
        console.error('Failed to update employee statuses:', error);
      }
    };

    if (user?.id && isValidUUID(user.id)) {
      updateEmployeeStatuses();
      const intervalId = setInterval(() => {
        updateEmployeeStatuses();
      }, 5 * 60 * 1000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [user?.id, updateEmployeeLeaveStatusFromVacations]);

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
    
    console.log(`[DashboardPage] SIMPLIFIED - Weekly assignments: ${filtered.length} assignments`);
    return filtered;
  }, [allAssignments, startDateISO, endDateISO]);

  // Enhanced loading state with proper error handling
  if (assignmentsLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-600">{t('common.loading')}...</p>
            <p className="text-sm text-gray-500">Loading dashboard data</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (assignmentsError) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-xl font-semibold">Error Loading Dashboard</div>
          <p className="text-gray-600">{assignmentsError.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
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
