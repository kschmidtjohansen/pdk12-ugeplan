
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';

interface AssignmentDistributionChartProps {
  assignments: Assignment[];
}

// Fix the return type of the component to return JSX
const AssignmentDistributionChart: React.FC<AssignmentDistributionChartProps> = ({ assignments }) => {
  const { t } = useTranslation();

  const data = [
    { name: t('dashboard.published'), value: assignments.filter(a => a.published).length },
    { name: t('dashboard.unpublished'), value: assignments.filter(a => !a.published).length },
  ];

  const COLORS = ['#22c55e', '#94a3b8'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t('dashboard.assignmentDistribution')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('dashboard.noAssignments')}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${value} ${t('dashboard.assignments')}`,
                  '',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentDistributionChart;
