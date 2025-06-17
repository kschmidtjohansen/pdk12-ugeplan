
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { format, getISOWeek, getISOWeekYear } from 'date-fns';
import { useAssignmentsConsolidated } from '@/hooks/useAssignmentsConsolidated';
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
  
  // Optimize data fetching - use single source for all assignments
  const { assignments: allAssignments, loading: assignmentsLoading } = useAssignmentsConsolidated({ 
    filter: 'all', 
    includeUnpublished: true 
  });
  
  const { employees, updateEmployeeLeaveStatusFromVacations } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();

  const today = new Date();
  const todayISOWeek = getISOWeek(today);
  const todayISOYear = getISOWeekYear(today);
  const [selectedWeek, setSelectedWeek] = useState(todayISOWeek);
  const [selectedYear, setSelectedYear] = useState(todayISOYear);

  const dailyQuote = getDailyQuote();

  // Memoize filtered assignments to prevent recalculation on every render
  const { publishedAssignments, userAssignments } = useMemo(() => {
    // Filter published assignments for metrics (admins/skadeleder)
    const published = allAssignments.filter(assignment => assignment.published);
    
    // Filter user-specific assignments for dashboard view
    const userFiltered = allAssignments.filter(assignment => {
      if (!user) return false;
      
      // Filter based on user role and assignment relationship
      if (user.role === 'administrator' || user.role === 'skadeleder') {
        return (assignment.responsibleUser && assignment.responsibleUser.id === user.id) ||
               (assignment.employees && assignment.employees.includes(user.name || ''));
      } else if (user.role === 'servicemedarbejder') {
        return assignment.employees && assignment.employees.includes(user.name || '');
      }
      
      return false;
    });
    
    return { publishedAssignments: published, userAssignments: userFiltered };
  }, [allAssignments, user]);

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
      // Reduce frequency of status updates to improve performance
      const intervalId = setInterval(() => {
        updateEmployeeStatuses();
      }, 5 * 60 * 1000); // Every 5 minutes instead of 30

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

  // Memoize filtered assignments for the week to prevent recalculation
  const myWeekAssignments = useMemo(() => {
    return AssignmentFilterService.filterByDateRange(
      userAssignments,
      startDateISO,
      endDateISO
    );
  }, [userAssignments, startDateISO, endDateISO]);

  const shouldShowMetrics = user?.role === 'administrator' || user?.role === 'skadeleder';
  const selectedDateForMetrics = getSelectedDateForMetrics();

  // Show loading state while assignments are being fetched
  if (assignmentsLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Welcome Header */}
        <WelcomeHeader userName={user?.name} dailyQuote={dailyQuote} />

        {/* Quick Access Grid */}
        <QuickAccessGrid userRole={user?.role} />

        {/* Dashboard Metrics - Pass optimized assignments data */}
        {shouldShowMetrics && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <DashboardMetrics selectedDate={selectedDateForMetrics} assignments={publishedAssignments} />
          </div>
        )}

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
