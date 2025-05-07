
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface AssignmentDistributionChartProps {
  assignments: Assignment[];
}

const AssignmentDistributionChart: React.FC<AssignmentDistributionChartProps> = ({ 
  assignments 
}) => {
  const { t } = useTranslation();
  
  // Group assignments by status
  const statusCount = assignments.reduce((acc: Record<string, number>, curr) => {
    const status = curr.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  // Convert to chart data
  const data = Object.keys(statusCount).map(status => ({
    name: t(`planner.status.${status}`),
    value: statusCount[status],
  }));

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">{t("dashboard.assignmentDistribution")}</h3>
        <div className="h-[300px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              {t("dashboard.noAssignmentData")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentDistributionChart;
