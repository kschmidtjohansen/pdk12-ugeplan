
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  onClick?: () => void;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
  className
}) => {
  const colorClasses = {
    blue: {
      icon: 'text-blue-600 bg-blue-50',
      accent: 'border-blue-200',
      hover: 'hover:border-blue-300'
    },
    green: {
      icon: 'text-green-600 bg-green-50',
      accent: 'border-green-200',
      hover: 'hover:border-green-300'
    },
    orange: {
      icon: 'text-orange-600 bg-orange-50',
      accent: 'border-orange-200',
      hover: 'hover:border-orange-300'
    },
    red: {
      icon: 'text-red-600 bg-red-50',
      accent: 'border-red-200',
      hover: 'hover:border-red-300'
    },
    purple: {
      icon: 'text-purple-600 bg-purple-50',
      accent: 'border-purple-200',
      hover: 'hover:border-purple-300'
    }
  };

  const classes = colorClasses[color];

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-200 border-l-4 shadow-soft hover:shadow-medium animate-scale-in',
        classes.accent,
        onClick && 'cursor-pointer hover-lift',
        onClick && classes.hover,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-3xl font-bold tracking-tight">
                {value}
              </p>
              {trend && (
                <span className={cn(
                  'text-sm font-medium px-2 py-1 rounded-full',
                  trend.isPositive 
                    ? 'text-green-700 bg-green-100' 
                    : 'text-red-700 bg-red-100'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-xl',
            classes.icon
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
