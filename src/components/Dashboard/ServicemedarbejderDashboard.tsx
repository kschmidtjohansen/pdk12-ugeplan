
import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useEnhancedUnifiedData } from '@/hooks/useEnhancedUnifiedData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import MineOpgaver from './MineOpgaver';
import { getCurrentWeekDates, getCurrentWeekNumber } from '@/utils/weekDates';
import { AssignmentFilterService } from '@/services/assignmentFilterService';
import DutySummaryWidget from './DutySummaryWidget';
import { LastRefreshIndicator } from '@/components/shared/LastRefreshIndicator';

const ServicemedarbejderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { assignments, loading, refetch, lastRefresh } = useEnhancedUnifiedData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const today = new Date();
  const currentWeek = getCurrentWeekNumber();
  const currentYear = new Date().getFullYear();

  // For servicemedarbejder, filter to show assignments where they are assigned OR responsible
  const userAssignments = useMemo(() => {
    if (!user?.name && !user?.id) {
      console.log('[ServicemedarbejderDashboard] ❌ No user name or ID');
      return [];
    }

    console.log('[ServicemedarbejderDashboard] 🔍 Filtering assignments for user:', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      totalAssignments: assignments.length
    });

    const filtered = assignments.filter(assignment => {
      // Check if user is assigned via assignedEmployees (NEW format with user IDs)
      const isAssignedViaNew = assignment.assignedEmployees?.some(emp => emp.id === user.id);
      
      // Check if user is assigned via legacy employees array (OLD format with names)
      const isAssignedViaLegacy = assignment.employees?.includes(user.name || '');
      
      // Check if user is responsible user
      const isResponsible = assignment.responsibleUserId === user.id || assignment.responsibleUser?.id === user.id;
      
      // COMPREHENSIVE LOGGING for matched assignments
      if (isAssignedViaNew || isAssignedViaLegacy || isResponsible) {
        console.log(`[ServicemedarbejderDashboard] ✅ Match found for "${assignment.title}":`, {
          date: assignment.date,
          isAssignedViaNew,
          isAssignedViaLegacy,
          isResponsible,
          assignedEmployees: assignment.assignedEmployees?.map(e => ({ id: e.id, name: e.name })),
          legacyEmployees: assignment.employees,
          responsibleUserId: assignment.responsibleUserId,
          responsibleUserObj: assignment.responsibleUser
        });
      }
      
      // Show all assignments where user is involved
      return isAssignedViaNew || isAssignedViaLegacy || isResponsible;
    });

    console.log(`[ServicemedarbejderDashboard] 📊 Filtered ${filtered.length} total user assignments`);

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
    
    console.log(`[ServicemedarbejderDashboard] 📅 Week filter (${startDateISO} to ${endDateISO}): ${filtered.length} assignments`);
    console.log(`[ServicemedarbejderDashboard] Week assignments:`, filtered.map(a => ({ title: a.title, date: a.date })));
    
    return filtered;
  }, [userAssignments, startDateISO, endDateISO]);

  // Today's assignments
  const todayAssignments = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    const filtered = userAssignments.filter(assignment => assignment.date === todayStr);
    
    console.log(`[ServicemedarbejderDashboard] 📍 Today filter (${todayStr}): ${filtered.length} assignments`);
    console.log(`[ServicemedarbejderDashboard] Today assignments:`, filtered.map(a => ({ title: a.title, date: a.date })));
    
    return filtered;
  }, [userAssignments, today]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
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
      {/* Personal Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Mine Statistikker</CardTitle>
          <LastRefreshIndicator 
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing}
            onRefresh={handleManualRefresh}
          />
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
