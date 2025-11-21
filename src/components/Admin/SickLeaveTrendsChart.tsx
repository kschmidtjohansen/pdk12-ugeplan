import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, TrendingUp, Activity } from 'lucide-react';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface MonthlyStats {
  month: string;
  month_label: string;
  total_sick_days: number;
  unique_employees: number;
  total_active_employees: number;
  sick_percentage: number;
  avg_sick_days: number;
}

interface TrendsData {
  months_back: number;
  data: MonthlyStats[];
  generated_at: string;
}

const chartConfig = {
  sick_percentage: {
    label: "Sygdomsprocent (%)",
    color: "hsl(var(--chart-1))",
  },
  unique_employees: {
    label: "Antal syge",
    color: "hsl(var(--chart-2))",
  },
  total_sick_days: {
    label: "Sygedage",
    color: "hsl(0, 84%, 60%)",
  },
  avg_sick_days: {
    label: "Gns. sygedage",
    color: "hsl(var(--chart-4))",
  },
};

export const SickLeaveTrendsChart: React.FC = () => {
  const [trendsData, setTrendsData] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthsBack, setMonthsBack] = useState<number>(12);
  const { toast } = useToast();

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const { data, error } = await rpcWithRefresh<TrendsData>(
        'get_historical_sick_leave_trends',
        { months_back: monthsBack }
      );

      if (error) throw error;

      setTrendsData(data?.data || []);

      toast({
        title: "Historisk data hentet",
        description: `Trend data for de sidste ${monthsBack} måneder er opdateret`,
      });
    } catch (error) {
      console.error('[SickLeaveTrends] Error fetching trends:', error);
      toast({
        title: "Fejl ved hentning af trends",
        description: error instanceof Error ? error.message : "Kunne ikke hente data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [monthsBack]);

  // Reverse data so oldest is on left, newest on right
  const chartData = [...trendsData].reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Historisk Oversigt
          </h3>
          <p className="text-sm text-muted-foreground">
            Sygdomstrends over den valgte periode
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={monthsBack.toString()} onValueChange={(v) => setMonthsBack(Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Sidste 3 måneder</SelectItem>
              <SelectItem value="6">Sidste 6 måneder</SelectItem>
              <SelectItem value="12">Sidste 12 måneder</SelectItem>
              <SelectItem value="24">Sidste 24 måneder</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchTrends} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Opdater
          </Button>
        </div>
      </div>

      {/* Sygdomsprocent og Antal Syge - Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sygdomsprocent og Antal Syge Medarbejdere
          </CardTitle>
          <CardDescription>
            Udvikling i sygefravær over tid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month_label" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs"
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sick_percentage"
                  stroke="var(--color-sick_percentage)"
                  strokeWidth={2}
                  name="Sygdomsprocent (%)"
                  dot={{ fill: "var(--color-sick_percentage)" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="unique_employees"
                  stroke="var(--color-unique_employees)"
                  strokeWidth={2}
                  name="Antal syge"
                  dot={{ fill: "var(--color-unique_employees)" }}
                />
                <ReferenceLine 
                  yAxisId="left"
                  y={3.8} 
                  stroke="#666" 
                  strokeDasharray="3 3"
                  label={{ 
                    value: 'Privat sektor gns. (3.8%)', 
                    position: 'right',
                    fill: '#666',
                    fontSize: 12
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Total Sygedage - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Total Sygedage per Måned</CardTitle>
          <CardDescription>
            Det samlede antal sygedage for alle medarbejdere i hver måned. Hvis en sygemelding strækker sig over flere måneder, tælles kun dagene i den pågældende måned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month_label" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs"
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="total_sick_days"
                  fill="var(--color-total_sick_days)"
                  name="Sygedage"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Gennemsnitlige Sygedage per Syg Medarbejder */}
      <Card>
        <CardHeader>
          <CardTitle>Gennemsnitlige Sygedage per Syg Medarbejder</CardTitle>
          <CardDescription>
            Hvor mange dage hver syg medarbejder i gennemsnit er fraværende
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month_label" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs"
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="avg_sick_days"
                  stroke="var(--color-avg_sick_days)"
                  strokeWidth={2}
                  name="Gns. sygedage"
                  dot={{ fill: "var(--color-avg_sick_days)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
