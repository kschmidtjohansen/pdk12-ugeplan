
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useAssignmentsConsolidated } from '@/hooks/useAssignmentsConsolidated';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import WeeklyAssignments from '@/components/Dashboard/WeeklyAssignments';
import VehicleStatusWidget from '@/components/Dashboard/VehicleStatusWidget';
import UnpublishedAssignmentsWidget from '@/components/Dashboard/UnpublishedAssignmentsWidget';
import WeeklyCalendar from '@/components/Dashboard/WeeklyCalendar';
import QuickAccessGrid from '@/components/Dashboard/QuickAccessGrid';
import { useWeekNavigation } from '@/hooks/useWeekNavigation';
import { filterByWeek } from '@/utils/dates';
import { useCars } from '@/hooks/car';
import PageHeader from '@/components/Layout/PageHeader';
import { useTranslation } from '@/context/TranslationContext';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  
  // Add debugging logs
  console.log('[DashboardPage] Component loading...');
  
  const { assignments, loading, error } = useAssignmentsConsolidated({ filter: 'my' });
  const { cars } = useCars();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  // Week navigation
  const {
    selectedWeek,
    selectedYear,
    weekDates,
    handlePreviousWeek,
    handleNextWeek
  } = useWeekNavigation();

  // Filter assignments for the current week
  const weekAssignments = filterByWeek(assignments, selectedWeek, selectedYear);

  // Add debugging logs
  console.log('[DashboardPage] State:', {
    assignmentsCount: assignments.length,
    loading,
    error,
    carsCount: cars.length,
    selectedDate,
    selectedWeek,
    weekAssignmentsCount: weekAssignments.length
  });

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading dashboard</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      {/* Quick Access Grid */}
      <QuickAccessGrid />

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Metrics */}
          <DashboardMetrics 
            selectedDate={selectedDate}
            assignments={assignments}
          />

          {/* Weekly Assignments */}
          <WeeklyAssignments
            assignments={weekAssignments}
            selectedWeek={selectedWeek}
            onPreviousWeek={handlePreviousWeek}
            onNextWeek={handleNextWeek}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Calendar */}
          <WeeklyCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            assignments={assignments}
            weekDates={weekDates}
          />

          {/* Vehicle Status */}
          <VehicleStatusWidget 
            cars={cars} 
            assignments={assignments}
          />

          {/* Unpublished Assignments */}
          <UnpublishedAssignmentsWidget 
            assignments={assignments.filter(a => !a.published)}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
