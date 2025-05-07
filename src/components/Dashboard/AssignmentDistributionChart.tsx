
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  ResponsiveContainer, 
  Tooltip,
  TooltipProps
} from 'recharts';

// Define the chart data type
type ChartDataType = {
  name: string;
  value: number;
};

interface AssignmentDistributionChartProps {
  assignments: Assignment[];
}

const AssignmentDistributionChart: React.FC<AssignmentDistributionChartProps> = ({ 
  assignments 
}) => {
  const { t, currentLanguage } = useTranslation();
  
  // Group assignments by type (using title as proxy for type)
  const assignmentsByType = assignments.reduce<Record<string, number>>((acc, assignment) => {
    // Extract assignment category from title (simplified approach)
    let category = assignment.title.split(' ')[0].toLowerCase();
    
    // Map common categories
    if (category.includes('vand') || category.includes('water')) {
      category = 'waterDamage';
    } else if (category.includes('brand') || category.includes('fire')) {
      category = 'fireDamage';
    } else if (category.includes('skimmel') || category.includes('mold')) {
      category = 'mold';
    } else {
      category = 'other';
    }
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  const chartData = Object.entries(assignmentsByType).map(([key, value]) => ({
    name: t(`dashboard.assignments.${key}`, { defaultValue: key }),
    value
  }));
  
  // Chart configuration
  const chartConfig = {
    waterDamage: { color: "#0EA5E9" },
    fireDamage: { color: "#F97316" },
    mold: { color: "#8B5CF6" },
    other: { color: "#8E9196" }
  };
  
  // Custom tooltip component that works with Recharts typing
  const CustomTooltip = ({ 
    active, 
    payload 
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <ChartTooltipContent 
          active={active}
          payload={payload}
        />
      );
    }
    return null;
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>{t('dashboard.charts.assignmentDistribution')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer
          config={chartConfig}
          className="aspect-[4/3]"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="var(--color-waterDamage)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AssignmentDistributionChart;
