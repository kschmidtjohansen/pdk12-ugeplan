
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Calendar, FileText } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon, className, onClick }) => {
  return (
    <Card 
      className={`${className} ${onClick ? 'hover:border-polygon-purple cursor-pointer transition-colors' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

interface SystemMetricsProps {
  onUsersClick?: () => void;
  onVehiclesClick?: () => void;
  onVacationClick?: () => void;
  onTasksClick?: () => void;
}

const SystemMetrics: React.FC<SystemMetricsProps> = ({ 
  onUsersClick, 
  onVehiclesClick, 
  onVacationClick,
  onTasksClick 
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title={t('admin.systemMetrics.totalUsers')}
        value="12"
        description={t('admin.systemMetrics.totalUsersDesc')}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        onClick={onUsersClick}
      />
      <MetricCard
        title={t('admin.systemMetrics.vehicles')}
        value="8"
        description={t('admin.systemMetrics.vehiclesDesc')}
        icon={<Car className="h-4 w-4 text-muted-foreground" />}
        onClick={onVehiclesClick}
      />
      <MetricCard
        title={t('admin.systemMetrics.vacationRequests')}
        value="4"
        description={t('admin.systemMetrics.vacationRequestsDesc')}
        icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        onClick={onVacationClick}
      />
      <MetricCard
        title={t('admin.systemMetrics.scheduledTasks')}
        value="15"
        description={t('admin.systemMetrics.scheduledTasksDesc')}
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        onClick={onTasksClick}
      />
    </div>
  );
};

export default SystemMetrics;
