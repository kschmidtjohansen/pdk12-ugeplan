
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useAssignmentDataOptimized } from '@/hooks/assignment/useAssignmentDataOptimized';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import MineOpgaver from './MineOpgaver';
import MinDag from './MinDag';
import { getCurrentWeekInfo, getWeekDates } from '@/utils/dates';
import DutySummaryWidget from './DutySummaryWidget';
import { LastRefreshIndicator } from '@/components/shared/LastRefreshIndicator';

const ServicemedarbejderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isDutyEnabled } = useDepartment();
  const { assignments, loading, fetchAssignments } = useAssignmentDataOptimized();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (assignments) {
      setLastRefresh(new Date());
    }
  }, [assignments]);

  const today = new Date();

  const userAssignments = useMemo(() => {
    if (!user?.id || !assignments) {
      return [];
    }

    const { week: currentWeek, year: currentYear } = getCurrentWeekInfo();
    const currentWeekDates = getWeekDates(currentWeek, currentYear);

    const filtered = assignments.filter(assignment => {
      const isAssignedViaNew = assignment.assignedEmployees?.some(emp => emp.id === user.id);
      const isAssignedViaLegacy = assignment.employees?.includes(user.name || '');
      const isResponsible = assignment.responsibleUserId === user.id || assignment.responsibleUser?.id === user.id;

      const assignmentDate = parseISO(assignment.date);
      const isInCurrentWeek = assignmentDate >= currentWeekDates.start && assignmentDate <= currentWeekDates.end;

      const isUserInvolved = isAssignedViaNew || isAssignedViaLegacy || isResponsible;

      return isUserInvolved && isInCurrentWeek;
    });

    return filtered;
  }, [assignments, user]);

  const weeklyAssignments = userAssignments;

  const todayAssignments = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    return userAssignments.filter(assignment => assignment.date === todayStr);
  }, [userAssignments, today]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchAssignments();
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MinDag />

      <Card>
        <CardHeader className="brand-card-header flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold brand-dot">Mine Statistikker</CardTitle>
          <LastRefreshIndicator 
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing}
            onRefresh={handleManualRefresh}
          />
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/60">
              <div className="p-3 bg-primary/10 rounded-full">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">I dag</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {todayAssignments.length}
                </p>
                <p className="text-xs text-muted-foreground">opgaver</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/60">
              <div className="p-3 bg-success-soft rounded-full">
                <Calendar className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Denne uge</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {weeklyAssignments.length}
                </p>
                <p className="text-xs text-muted-foreground">opgaver</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {isDutyEnabled && <DutySummaryWidget />}

      <MineOpgaver />
    </div>
  );
};

export default ServicemedarbejderDashboard;
