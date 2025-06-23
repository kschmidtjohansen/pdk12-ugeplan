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
  
  // COMPREHENSIVE FIX: Use separate, properly configured queries
  // For metrics: show all published assignments 
  const { assignments: allPublishedAssignments, loading: allAssignmentsLoading, error: allAssignmentsError } = useOptimizedAssignments('published');
  
  // For user's weekly view: show only user's assignments (published and unpublished)
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

  console.log(`[DashboardPage] COMPREHENSIVE FIX - Processing assignments for user: ${user?.name} (${user?.role})`);
  console.log(`[DashboardPage] COMPREHENSIVE FIX - All published assignments for metrics: ${allPublishedAssignments.length}`);
  console.log(`[DashboardPage] COMPREHENSIVE FIX - User assignments for weekly view: ${userAssignments.length}`);
  
  // Log assignment details for debugging
  allPublishedAssignments.forEach(assignment => {
    console.log(`[DashboardPage] Published assignment ${assignment.id} (${assignment.title}):`, {
      employees: assignment.employees,
      responsibleUser: assignment.responsibleUser,
      published: assignment.published
    });
  });

  userAssignments.forEach(assignment => {
    console.log(`[DashboardPage] COMPREHENSIVE FIX - User assignment ${assignment.id} (${assignment.title}) with colleagues preserved:`, {
      employees: assignment.employees,
      responsibleUser: assignment.responsibleUser,
      published: assignment.published
    });
  });

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

  // COMPREHENSIVE FIX: Use user assignments for weekly view (filtered by date range)
  const myWeekAssignments = useMemo(() => {
    const filtered = AssignmentFilterService.filterByDateRange(
      userAssignments, // User's assignments with all colleague info preserved
      startDateISO,
      endDateISO
    );
    
    console.log(`[DashboardPage] COMPREHENSIVE FIX - Weekly assignments for ${user?.name}: ${filtered.length} assignments`);
    filtered.forEach(assignment => {
      console.log(`[DashboardPage] COMPREHENSIVE FIX - Weekly assignment ${assignment.title} shows colleagues: [${assignment.employees?.join(', ')}]`);
    });
    
    return filtered;
  }, [userAssignments, startDateISO, endDateISO, user?.name]);

  // Enhanced loading state with connection status
  if (allAssignmentsLoading || userAssignmentsLoading) {
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
                    {t('dashboard.connectionStatus', { status: authStatus.connectionStatus })}
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    {!authStatus.sessionValid && <p>{t('dashboard.sessionValidationFailed')}</p>}
                    {authStatus.tokenExpiring && <p>{t('dashboard.tokenExpiringSoon')}</p>}
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
  if (allAssignmentsError && allAssignmentsError.includes('auth')) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('common.authRequired')}</h2>
          <p className="text-gray-600 mb-4">{t('dashboard.loginToAccess')}</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {t('common.login')}
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
                  {t('dashboard.connectionIssueDetected')}
                </h3>
                <div className="mt-1 text-sm text-yellow-700">
                  {t('dashboard.connectionIssueDescription')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />

        {/* Quick Access Grid */}
        <QuickAccessGrid userRole={user?.role} />

        {/* Dashboard Metrics - Show all published assignments for system-wide metrics */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <DashboardMetrics selectedDate={format(new Date(), 'yyyy-MM-dd')} assignments={allPublishedAssignments} />
        </div>

        {/* COMPREHENSIVE FIX: Weekly Assignments - Pass user assignments with colleague info preserved */}
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
