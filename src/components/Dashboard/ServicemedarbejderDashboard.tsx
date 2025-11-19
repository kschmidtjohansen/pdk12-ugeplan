
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useEnhancedUnifiedData } from '@/hooks/useEnhancedUnifiedData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
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
  
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(() => {
    const saved = localStorage.getItem('servicemedarbejderStatsCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('servicemedarbejderStatsCollapsed', JSON.stringify(isStatsCollapsed));
  }, [isStatsCollapsed]);

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
      {/* Personal Stats */}
      <Collapsible open={!isStatsCollapsed} onOpenChange={(open) => setIsStatsCollapsed(!open)}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Mine Statistikker</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isStatsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          
          <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Opgaver denne uge</p>
                  <p className="text-2xl font-bold">{weeklyAssignments.length}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Opgaver i dag</p>
                  <p className="text-2xl font-bold">{todayAssignments.length}</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <DutySummaryWidget />

      <MineOpgaver />
    </div>
  );
};

export default ServicemedarbejderDashboard;
