
import React, { useMemo } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext';
import { useOptimizedAssignments } from '@/hooks/useOptimizedAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters';
import { getCurrentWeekInfo, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/dates';
import { getDailyQuote } from '@/utils/dailyQuotes';
import WelcomeHeader from '@/components/Dashboard/WelcomeHeader';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import WeeklyAssignments from '@/components/Dashboard/WeeklyAssignments';
import QuickAccessGrid from '@/components/Dashboard/QuickAccessGrid';
import UpcomingVacationsWidget from '@/components/Dashboard/UpcomingVacationsWidget';
import VehicleStatusWidget from '@/components/Dashboard/VehicleStatusWidget';
import SystemMetricsOverview from '@/components/Dashboard/SystemMetricsOverview';
import { Spinner } from '@/components/ui/spinner';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();
  const { user } = useAuth();
  const userId = user?.id;
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();
  
  // Get current week info
  const currentWeekInfo = getCurrentWeekInfo();
  const [selectedWeek, setSelectedWeek] = React.useState(currentWeekInfo.week);
  
  // FIXED: Use 'all' filter to get complete assignment data with all employees
  const { 
    assignments, 
    loading: assignmentsLoading, 
    error: assignmentsError 
  } = useOptimizedAssignments({ filter: 'all', includeUnpublished: true });

  const { filterByWeek, filterUserAssignments } = useAssignmentFilters();

  // Filter assignments for the selected week
  const weekAssignments = useMemo(() => {
    const filtered = filterByWeek(assignments, selectedWeek, currentWeekInfo.year);
    console.log(`[DashboardPage] Week ${selectedWeek} assignments:`, filtered.length);
    return filtered;
  }, [assignments, selectedWeek, currentWeekInfo.year, filterByWeek]);

  // FIXED: Filter user's assignments but preserve complete employee data
  const userAssignments = useMemo(() => {
    if (!userId) return [];
    
    // Get user's assignments while preserving ALL employee data for each assignment
    const userFiltered = filterUserAssignments(weekAssignments, userId);
    
    console.log(`[DashboardPage] FIXED: User ${userId} assignments with complete employee data:`, 
      userFiltered.map(a => ({
        title: a.title,
        id: a.id,
        employees: a.employees, // This should show ALL colleagues including the user
        responsibleUser: a.responsibleUser?.name
      }))
    );
    
    return userFiltered;
  }, [weekAssignments, userId, filterUserAssignments]);

  // Calculate metrics for system overview
  const availableEmployees = employees.filter(emp => emp.is_available).length;
  const totalEmployees = employees.length;
  const availableVehicles = cars.filter(car => car.is_available).length;
  const totalVehicles = cars.length;

  // Get daily quote
  const dailyQuote = getDailyQuote();

  // Navigation handlers
  const handlePreviousWeek = React.useCallback(() => {
    const { week } = getPreviousWeekInfo(selectedWeek, currentWeekInfo.year);
    setSelectedWeek(week);
  }, [selectedWeek, currentWeekInfo.year]);

  const handleNextWeek = React.useCallback(() => {
    const { week } = getNextWeekInfo(selectedWeek, currentWeekInfo.year);
    setSelectedWeek(week);
  }, [selectedWeek, currentWeekInfo.year]);

  if (assignmentsLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-lg font-medium text-gray-600">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  if (assignmentsError) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600">{assignmentsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-8">
        <WelcomeHeader 
          userName={user?.user_metadata?.name || user?.email || 'Bruger'}
          dailyQuote={dailyQuote}
        />
        
        <DashboardMetrics 
          selectedDate={new Date().toISOString().split('T')[0]}
          assignments={weekAssignments}
        />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <WeeklyAssignments 
              assignments={userAssignments}
              selectedWeek={selectedWeek}
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
            />
            
            <QuickAccessGrid />
          </div>
          
          <div className="space-y-8">
            <UpcomingVacationsWidget vacations={vacations} />
            <VehicleStatusWidget />
            {(isAdmin || isSkadeleder) && (
              <SystemMetricsOverview 
                assignments={assignments}
                vacations={vacations}
                availableEmployees={availableEmployees}
                totalEmployees={totalEmployees}
                availableVehicles={availableVehicles}
                totalVehicles={totalVehicles}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
