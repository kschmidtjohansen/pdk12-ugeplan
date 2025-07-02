
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Car, Calendar, Clock } from 'lucide-react';
import { useEnhancedUnifiedData } from '@/hooks/useEnhancedUnifiedData';
import { useTranslation } from '@/context/TranslationContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

const DashboardMetrics: React.FC = () => {
  const { employees, assignments, cars, loading, error } = useEnhancedUnifiedData();
  const { t } = useTranslation();

  if (loading) {
    return <LoadingSpinner message={t('common.loading')} />;
  }

  if (error) {
    return (
      <EmptyState
        title={t('common.error')}
        description={error}
        action={{
          label: t('common.retry'),
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  const activeEmployees = employees.filter(emp => !emp.onLeave).length;
  const availableCars = cars.filter(car => car.is_available).length;
  const publishedAssignments = assignments.filter(assignment => assignment.published).length;
  const todayAssignments = assignments.filter(assignment => 
    assignment.date === new Date().toISOString().split('T')[0]
  ).length;

  const metrics = [
    {
      title: t('dashboard.metrics.activeEmployees'),
      value: activeEmployees,
      total: employees.length,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: t('dashboard.metrics.availableCars'),
      value: availableCars,
      total: cars.length,
      icon: Car,
      color: 'text-blue-600'
    },
    {
      title: t('dashboard.metrics.publishedAssignments'),
      value: publishedAssignments,
      total: assignments.length,
      icon: Calendar,
      color: 'text-purple-600'
    },
    {
      title: t('dashboard.metrics.todayAssignments'),
      value: todayAssignments,
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metric.value}
              {metric.total && (
                <span className="text-sm text-muted-foreground ml-1">
                  / {metric.total}
                </span>
              )}
            </div>
            {metric.total && (
              <Badge variant="outline" className="mt-1">
                {Math.round((metric.value / metric.total) * 100)}% {t('common.available').toLowerCase()}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardMetrics;
