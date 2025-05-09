
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';

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
  const {
    t,
    currentLanguage
  } = useTranslation();

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
    name: t(`dashboard.assignments.${key}`, {
      defaultValue: key
    }),
    value
  }));

  // Chart configuration
  const chartConfig = {
    waterDamage: {
      color: "#0EA5E9"
    },
    fireDamage: {
      color: "#F97316"
    },
    mold: {
      color: "#8B5CF6"
    },
    other: {
      color: "#8E9196"
    }
  };

  // Custom tooltip component that works with Recharts typing
  const CustomTooltip = ({
    active,
    payload
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return <ChartTooltipContent active={active} payload={payload} />;
    }
    return null;
  };

  // If no assignments, show empty state
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.assignmentDistribution', { defaultValue: 'Assignment Distribution' })}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">{t('dashboard.noData', { defaultValue: 'No assignment data available' })}</p>
        </CardContent>
      </Card>
    );
  }

  // Return the JSX for the chart
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.assignmentDistribution', { defaultValue: 'Assignment Distribution' })}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px]" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis dataKey="name" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#0EA5E9" name="assignments" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AssignmentDistributionChart;
