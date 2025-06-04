
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { Users, Car, Calendar, Clock } from 'lucide-react';

interface QuickStats {
  totalEmployees: number;
  availableEmployees: number;
  totalCars: number;
  availableCars: number;
  carsInUse: number;
  pendingVacations: number;
  todayAssignments: number;
}

interface QuickStatsGridProps {
  stats: QuickStats;
}

const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({ stats }) => {
  const { t } = useTranslation();

  const statCards = [
    {
      title: t('admin.stats.totalEmployees'),
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: t('admin.stats.availableEmployees'),
      value: stats.availableEmployees,
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: t('admin.stats.totalCars'),
      value: stats.totalCars,
      icon: Car,
      color: 'text-purple-600'
    },
    {
      title: t('admin.stats.availableCars'),
      value: stats.availableCars,
      icon: Car,
      color: 'text-orange-600'
    },
    {
      title: t('admin.stats.pendingVacations'),
      value: stats.pendingVacations,
      icon: Calendar,
      color: 'text-yellow-600'
    },
    {
      title: t('admin.stats.todayAssignments'),
      value: stats.todayAssignments,
      icon: Clock,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStatsGrid;
