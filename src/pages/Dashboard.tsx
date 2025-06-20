
import React from 'react';
import { PageContainer } from '@/components/PageContainer';
import WeeklyAssignments from '@/components/Dashboard/WeeklyAssignments';
import { useDashboard } from '@/hooks/useDashboard';
import { useTranslation } from '@/context/TranslationContext';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  
  // FIXED: Use dedicated dashboard hook with proper week filtering
  const {
    assignments,
    allAssignments,
    loading,
    error,
    selectedWeek,
    selectedYear,
    handlePreviousWeek,
    handleNextWeek,
    resetToCurrentWeek
  } = useDashboard();

  console.log('[Dashboard] FIXED - Rendering with:', {
    weekAssignments: assignments.length,
    allAssignments: allAssignments.length,
    selectedWeek,
    selectedYear,
    loading
  });

  if (loading) {
    return (
      <PageContainer title={t('dashboard.title')}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title={t('dashboard.title')}>
        <div className="text-center text-red-600 p-4">
          <p>Error loading dashboard: {error}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={t('dashboard.title')}>
      <div className="space-y-6">
        {/* FIXED: Pass proper week-filtered assignments */}
        <WeeklyAssignments 
          assignments={assignments}
          selectedWeek={selectedWeek}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
        />
      </div>
    </PageContainer>
  );
};

export default Dashboard;
