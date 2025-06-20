import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { format, getISOWeek, getISOWeekYear } from 'date-fns';
import { useOptimizedAssignments } from '@/hooks/useOptimizedAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { useAuthenticationMonitor } from '@/hooks/useAuthenticationMonitor';
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
  
  // Enhanced authentication monitoring
  const { authStatus } = useAuthenticationMonitor();
  
  // CRITICAL FIX: Use separate queries for dashboard context - all assignments for metrics, user assignments for personal view
  const { assignments: allAssignments, loading: assignmentsLoading, error: assignmentsError } = useOptimizedAssignments('all');
  
  const { assignments: userAssignments, loading: userAssignmentsLoading } = useOptimizedAssignments('user');
  
  const { employees, updateEmployeeLeaveStatusFromVacations } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();

  const today = new Date();
  const todayISOWeek = getISOWeek(today);
  const todayISOYear = getISOWeekYear(today);
  const [selectedWeek, setSelectedWeek] = useState(todayISOWeek);
  const [selectedYear, setSelectedYear] = useState(todayISOYear);

  const dailyQuote = getDailyQuote();

  // Show connection status if there are issues
  const showConnectionIssue = !authStatus.sessionValid || authStatus.connectionStatus === 'disconnected';

  console.log(`[DashboardPage] CRITICAL FIX - Processing assignments for user: ${user?.name} (${user?.role})`);
  console.log(`[DashboardPage] CRITICAL FIX - Total all assignments received: ${allAssignments.length}`);
  console.log(`[DashboardPage] CRITICAL FIX - User assignments received: ${userAssignments.length}`);
  
  // Log assignment details for debugging
  allAssignments.forEach(assignment => {
    console.log(`[DashboardPage] All assignment ${assignment.id} (${assignment.title}):`, {
      employees: assignment.employees,
      responsibleUser: assignment.responsibleUser,
      published: assignment.published
    });
  });

  userAssignments.forEach(assignment => {
    console.log(`[DashboardPage] CRITICAL FIX - User assignment ${assignment.id} (${assignment.title}) with ALL colleagues preserved:`, {
      employees: assignment.employees,
      responsibleUser: assignment.responsibleUser,
      published: assignment.published
    });
  });

  // CRITICAL FIX: Use appropriate assignment sets for different purposes
  const { publishedAssignments } = useMemo(() => {
    // For metrics - use all published assignments
    const published = allAssignments.filter(assignment => assignment.published);
    
    console.log(`[DashboardPage] CRITICAL FIX - Metrics will show ${published.length} published assignments`);
    
    return { publishedAssignments: published };
  }, [allAssignments]);

  // Update employee leave status based on vacations when dashboard loads
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

  // Calculate the selected date for metrics based on current week selection
  const getSelectedDateForMetrics = () => {
    const weekDates = getCurrentWeekDates(selectedWeek, selectedYear);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const weekStartStr = format(weekDates.start, 'yyyy-MM-dd');
    const weekEndStr = format(weekDates.end, 'yyyy-MM-dd');
    
    if (todayStr >= weekStartStr && todayStr <= weekEndStr) {
      return todayStr;
    }
    
    return weekStartStr;
  };

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

  // CRITICAL FIX: Use user assignments for weekly view (these already have ALL colleague names preserved)
  const myWeekAssignments = useMemo(() => {
    const filtered = AssignmentFilterService.filterByDateRange(
      userAssignments, // This contains user's assignments with ALL employee names preserved
      startDateISO,
      endDateISO
    );
    
    console.log(`[DashboardPage] CRITICAL FIX - Weekly assignments for ${user?.name}: ${filtered.length} assignments`);
    filtered.forEach(assignment => {
      console.log(`[DashboardPage] CRITICAL FIX - Weekly assignment ${assignment.title} shows ALL colleagues: [${assignment.employees?.join(', ')}]`);
    });
    
    return filtered;
  }, [userAssignments, startDateISO, endDateISO, user?.name]);

  // Show metrics to ALL users
  const shouldShowMetrics = true;
  const selectedDateForMetrics = getSelectedDateForMetrics();

  // Enhanced loading state with connection status
  if (assignmentsLoading || userAssignmentsLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
          {showConnectionIssue && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Connection Status: {authStatus.connectionStatus}
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    {!authStatus.sessionValid && <p>Session validation failed</p>}
                    {authStatus.tokenExpiring && <p>Token expiring soon</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there are critical errors
  if (assignmentsError && assignmentsError.includes('auth')) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Connection Status Warning */}
        {showConnectionIssue && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Connection Issue Detected
                </h3>
                <div className="mt-1 text-sm text-yellow-700">
                  Some data may not be up to date. Check your internet connection or try refreshing the page.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />

        {/* Quick Access Grid */}
        <QuickAccessGrid userRole={user?.role} />

        {/* Dashboard Metrics - Show to all users, pass all published assignments */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <DashboardMetrics selectedDate={format(new Date(), 'yyyy-MM-dd')} assignments={publishedAssignments} />
        </div>

        {/* CRITICAL FIX: Weekly Assignments - Pass user assignments with ALL colleague info preserved */}
        <div style={{ animationDelay: '0.4s' }} className="animate-fade-in-up">
          <WeeklyAssignments
            assignments={userAssignments}
            selectedWeek={selectedWeek}
            onPreviousWeek={() => {
              const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
              setSelectedWeek(week);
              setSelectedYear(year);
            }}
            onNextWeek={() => {
              const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
              setSelectedWeek(week);
              setSelectedYear(year);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
