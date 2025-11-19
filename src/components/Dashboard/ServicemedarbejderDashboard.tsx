
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useEnhancedUnifiedData } from '@/hooks/useEnhancedUnifiedData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import MineOpgaver from './MineOpgaver';
import { getCurrentWeekDates, getCurrentWeekNumber } from '@/utils/weekDates';
import { AssignmentFilterService } from '@/services/assignmentFilterService';
import { useMemo } from 'react';
import DutySummaryWidget from './DutySummaryWidget';

const ServicemedarbejderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { assignments, loading } = useEnhancedUnifiedData();

  const today = new Date();
  const currentWeek = getCurrentWeekNumber();
  const currentYear = new Date().getFullYear();

  // For servicemedarbejder, filter to show assignments where they are assigned OR responsible
  const userAssignments = useMemo(() => {
    if (!user?.name && !user?.id) {
      return [];
    }

    const filtered = assignments.filter(assignment => {
      // Check if user is assigned as employee
      const isEmployee = assignment.employees?.includes(user.name || '');
      
      // Check if user is responsible user
      const isResponsible = assignment.responsibleUserId === user.id;
      
      // For servicemedarbejder, show published assignments where they are involved
      const shouldShow = assignment.published && (isEmployee || isResponsible);
      
      return shouldShow;
    });

    return filtered;
  }, [assignments, user]);

  // Get weekly assignments
  const weekDates = getCurrentWeekDates(currentWeek, currentYear);
  const startDateISO = format(weekDates.start, 'yyyy-MM-dd');
  const endDateISO = format(weekDates.end, 'yyyy-MM-dd');

  const weeklyAssignments = useMemo(() => {
    const filtered = AssignmentFilterService.filterByDateRange(
      userAssignments,
      startDateISO,
      endDateISO
    );
    
    return filtered;
  }, [userAssignments, startDateISO, endDateISO]);

  // Today's assignments
  const todayAssignments = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    const filtered = userAssignments.filter(assignment => assignment.date === todayStr);
    
    return filtered;
  }, [userAssignments, today]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Stats - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        <DutySummaryWidget />
      </div>

      {/* Mine Opgaver */}
      <MineOpgaver />
    </div>
  );
};

export default ServicemedarbejderDashboard;
