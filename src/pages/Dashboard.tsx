
import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import WeeklyAssignments from '../components/Dashboard/WeeklyAssignments';
import MineOpgaver from '../components/Dashboard/MineOpgaver';
import { DashboardErrorBoundary } from '@/components/ErrorBoundary/DashboardErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-lg font-medium text-gray-600">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }

  const totalWeeklyAssignments = assignments.length;
  const totalAllAssignments = allAssignments.length;

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 lg:p-8 text-white shadow-2xl animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="space-y-1 lg:space-y-3">
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                      {t('dashboard.welcome', { name: user?.name || '' })}
                    </h1>
                    <p className="text-blue-100 text-sm lg:text-lg font-medium">
                      {t('dashboard.subtitle')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-primary" />
                  {t('dashboard.thisWeek')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalWeeklyAssignments}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.assignmentsThisWeek')}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  {t('dashboard.total')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalAllAssignments}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.totalAssignments')}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-blue-600" />
                  {t('dashboard.team')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{user?.role || 'User'}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.yourRole')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Assignments */}
            <div className="space-y-6">
              <WeeklyAssignments 
                assignments={assignments}
                selectedWeek={selectedWeek}
                onPreviousWeek={handlePreviousWeek}
                onNextWeek={handleNextWeek}
              />
            </div>

            {/* Mine Opgaver */}
            <div className="space-y-6">
              <MineOpgaver />
            </div>
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default Dashboard;
