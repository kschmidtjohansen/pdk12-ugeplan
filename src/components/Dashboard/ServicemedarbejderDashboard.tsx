
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
      
      // For servicemedarbejder, show all assignments where they are involved
      const shouldShow = (isEmployee || isResponsible);
      
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
      {/* Personal Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Mine Statistikker</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">I dag</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {todayAssignments.length}
                </p>
                <p className="text-xs text-muted-foreground">opgaver</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Denne uge</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {weeklyAssignments.length}
                </p>
                <p className="text-xs text-muted-foreground">opgaver</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DutySummaryWidget />

      <MineOpgaver />
    </div>
  );
};

export default ServicemedarbejderDashboard;
