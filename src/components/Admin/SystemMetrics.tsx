
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Calendar } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon, className }) => {
  return (
    <Card className={className}>
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

const SystemMetrics: React.FC = () => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title="Total Users"
        value="12"
        description="5 active today"
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      <MetricCard
        title="Vehicles"
        value="8"
        description="3 currently in use"
        icon={<Car className="h-4 w-4 text-muted-foreground" />}
      />
      <MetricCard
        title="Vacation Requests"
        value="4"
        description="2 pending approval"
        icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
};

export default SystemMetrics;
