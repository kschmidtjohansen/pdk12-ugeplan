
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Calendar } from 'lucide-react';
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
  usersCount: number;
  vehiclesCount: number;
  pendingVacationCount: number;
  activeUsersCount?: number;
  inUseVehiclesCount?: number;
}

const SystemMetrics: React.FC<SystemMetricsProps> = ({ 
  onUsersClick, 
  onVehiclesClick, 
  onVacationClick,
  usersCount,
  vehiclesCount,
  pendingVacationCount,
  activeUsersCount = 0,
  inUseVehiclesCount = 0
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title={t('admin.systemMetrics.totalUsers')}
        value={usersCount.toString()}
        description={t('admin.systemMetrics.totalUsersDesc', { count: activeUsersCount })}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        onClick={onUsersClick}
      />
      <MetricCard
        title={t('admin.systemMetrics.vehicles')}
        value={vehiclesCount.toString()}
        description={t('admin.systemMetrics.vehiclesDesc', { count: inUseVehiclesCount })}
        icon={<Car className="h-4 w-4 text-muted-foreground" />}
        onClick={onVehiclesClick}
      />
      <MetricCard
        title={t('admin.systemMetrics.vacationRequests')}
        value={pendingVacationCount.toString()}
        description={t('admin.systemMetrics.vacationRequestsDesc')}
        icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        onClick={onVacationClick}
      />
    </div>
  );
};

export default SystemMetrics;
