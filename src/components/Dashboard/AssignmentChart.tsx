
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/context/TranslationContext';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';

const AssignmentChart: React.FC = () => {
  const { t } = useTranslation();
  const { assignments } = usePlannerAssignments();
  
  // Count assignment types
  const assignmentCounts = assignments.reduce<Record<string, number>>((acc, assignment) => {
    // Use the assignment title as the type (simplified approach)
    const type = assignment.title;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  // Format data for the chart
  const chartData = Object.entries(assignmentCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value) // Sort by count descending
    .slice(0, 5); // Limit to top 5 types
  
  // Colors for the chart
  const COLORS = ['#8B5CF6', '#D946EF', '#0EA5E9', '#F97316', '#10B981'];
  
  const chartConfig = {
    waterDamage: { label: t('dashboard.assignments.waterDamage'), color: '#8B5CF6' },
    fireDamage: { label: t('dashboard.assignments.fireDamage'), color: '#D946EF' },
    mold: { label: t('dashboard.assignments.mold'), color: '#0EA5E9' },
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>{t('dashboard.assignmentDistribution')}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8B5CF6"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AssignmentChart;
