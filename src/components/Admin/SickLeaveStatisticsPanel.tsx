import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, Calendar, AlertCircle } from 'lucide-react';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface SickLeaveStats {
  period_type: string;
  start_date: string;
  end_date: string;
  total_sick_days: number;
  unique_employees: number;
  top_employees: Array<{
    employee_id: string;
    employee_name: string;
    total_days: number;
    occurrences: number;
  }>;
  generated_at: string;
}

export const SickLeaveStatisticsPanel: React.FC = () => {
  const [weekStats, setWeekStats] = useState<SickLeaveStats | null>(null);
  const [fourteenDayStats, setFourteenDayStats] = useState<SickLeaveStats | null>(null);
  const [monthStats, setMonthStats] = useState<SickLeaveStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      console.log('[SickLeaveStats] Fetching week stats...');
      const { data: weekData, error: weekError } = await rpcWithRefresh<SickLeaveStats>(
        'get_sick_leave_statistics',
        { period_type: 'week' }
      );
      if (weekError) {
        console.error('[SickLeaveStats] Week error:', weekError);
        throw weekError;
      }
      console.log('[SickLeaveStats] Week data:', weekData);
      setWeekStats(weekData);

      console.log('[SickLeaveStats] Fetching 14-day stats...');
      const { data: fourteenData, error: fourteenError } = await rpcWithRefresh<SickLeaveStats>(
        'get_sick_leave_statistics',
        { period_type: '14days' }
      );
      if (fourteenError) {
        console.error('[SickLeaveStats] 14-day error:', fourteenError);
        throw fourteenError;
      }
      console.log('[SickLeaveStats] 14-day data:', fourteenData);
      setFourteenDayStats(fourteenData);

      console.log('[SickLeaveStats] Fetching month stats...');
      const { data: monthData, error: monthError } = await rpcWithRefresh<SickLeaveStats>(
        'get_sick_leave_statistics',
        { period_type: 'month' }
      );
      if (monthError) {
        console.error('[SickLeaveStats] Month error:', monthError);
        throw monthError;
      }
      console.log('[SickLeaveStats] Month data:', monthData);
      setMonthStats(monthData);

    } catch (error) {
      console.error('[SickLeaveStats] Error fetching sick leave statistics:', error);
      toast({
        title: "Fejl ved hentning af sygdomsstatistik",
        description: error instanceof Error ? error.message : "Kunne ikke hente data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const renderStatCard = (stats: SickLeaveStats | null, title: string, icon: React.ReactNode) => {
    if (!stats) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>
            {new Date(stats.start_date).toLocaleDateString('da-DK')} - {new Date(stats.end_date).toLocaleDateString('da-DK')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total sygedage</p>
              <p className="text-2xl font-bold">{stats.total_sick_days}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Antal medarbejdere</p>
              <p className="text-2xl font-bold">{stats.unique_employees}</p>
            </div>
          </div>

          {stats.top_employees && stats.top_employees.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Top 5 - Flest sygedage</p>
              <div className="space-y-2">
                {stats.top_employees.map((emp, idx) => (
                  <div key={emp.employee_id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={idx === 0 ? "destructive" : "secondary"}>
                        #{idx + 1}
                      </Badge>
                      <span className="font-medium">{emp.employee_name}</span>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{emp.total_days} dage</p>
                      <p className="text-muted-foreground">{emp.occurrences} {emp.occurrences === 1 ? 'gang' : 'gange'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>GDPR Advarsel:</strong> Disse data er ekstremt personfølsomme og må kun bruges til interne statistiske formål. 
          Del aldrig disse oplysninger med uautoriserede personer.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sygdomsstatistik</h2>
          <p className="text-muted-foreground">Oversigt over sygefravær i afdelingen</p>
        </div>
        <Button onClick={fetchStatistics} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Opdater
        </Button>
      </div>

      <Tabs defaultValue="week" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="week">Denne uge</TabsTrigger>
          <TabsTrigger value="14days">Seneste 14 dage</TabsTrigger>
          <TabsTrigger value="month">Denne måned</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-4">
          {renderStatCard(weekStats, "Denne uge", <Calendar className="h-5 w-5" />)}
        </TabsContent>

        <TabsContent value="14days" className="space-y-4">
          {renderStatCard(fourteenDayStats, "Seneste 14 dage", <TrendingUp className="h-5 w-5" />)}
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          {renderStatCard(monthStats, "Denne måned", <Users className="h-5 w-5" />)}
        </TabsContent>
      </Tabs>
    </div>
  );
};
