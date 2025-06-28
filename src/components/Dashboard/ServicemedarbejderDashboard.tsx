
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useEnhancedUnifiedData } from '@/hooks/useEnhancedUnifiedData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import WeeklyAssignments from './WeeklyAssignments';
import { getCurrentWeekDates, getCurrentWeekNumber, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/weekDates';
import { AssignmentFilterService } from '@/services/assignmentFilterService';
import { useMemo, useState } from 'react';

const ServicemedarbejderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { assignments, isLoading } = useEnhancedUnifiedData();

  const today = new Date();
  const currentWeek = getCurrentWeekNumber();
  const currentYear = new Date().getFullYear();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Filter assignments for the current user only
  const userAssignments = useMemo(() => {
    if (!user?.name) return [];
    return assignments.filter(assignment => 
      assignment.employees?.includes(user.name) || 
      assignment.responsibleUserId === user.id
    );
  }, [assignments, user]);

  // Get weekly assignments
  const weekDates = getCurrentWeekDates(selectedWeek, selectedYear);
  const startDateISO = format(weekDates.start, 'yyyy-MM-dd');
  const endDateISO = format(weekDates.end, 'yyyy-MM-dd');

  const weeklyAssignments = useMemo(() => {
    return AssignmentFilterService.filterByDateRange(
      userAssignments,
      startDateISO,
      endDateISO
    );
  }, [userAssignments, startDateISO, endDateISO]);

  // Today's assignments
  const todayAssignments = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    return userAssignments.filter(assignment => assignment.date === todayStr);
  }, [userAssignments, today]);

  // Completed assignments (published ones from the past)
  const completedAssignments = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    return userAssignments.filter(assignment => 
      assignment.date < todayStr && assignment.published
    );
  }, [userAssignments, today]);

  const handlePreviousWeek = () => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  const handleNextWeek = () => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              {t('dashboard.thisWeek')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{weeklyAssignments.length}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.assignmentsThisWeek')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              {t('dashboard.today')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayAssignments.length}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.tasksToday')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {t('dashboard.completed')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedAssignments.length}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.completedTasks')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Assignments */}
      <WeeklyAssignments
        assignments={weeklyAssignments}
        selectedWeek={selectedWeek}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
      />
    </div>
  );
};

export default ServicemedarbejderDashboard;
