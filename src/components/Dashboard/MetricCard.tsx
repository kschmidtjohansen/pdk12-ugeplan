
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
      icon: 'text-blue-600 bg-blue-50 border-blue-200',
      accent: 'border-l-blue-500',
      hover: 'hover:border-blue-300'
    },
    green: {
      icon: 'text-green-600 bg-green-50 border-green-200',
      accent: 'border-l-green-500',
      hover: 'hover:border-green-300'
    },
    orange: {
      icon: 'text-orange-600 bg-orange-50 border-orange-200',
      accent: 'border-l-orange-500',
      hover: 'hover:border-orange-300'
    },
    red: {
      icon: 'text-red-600 bg-red-50 border-red-200',
      accent: 'border-l-red-500',
      hover: 'hover:border-red-300'
    },
    purple: {
      icon: 'text-purple-600 bg-purple-50 border-purple-200',
      accent: 'border-l-purple-500',
      hover: 'hover:border-purple-300'
    }
  };

  const classes = colorClasses[color];

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-200 border-l-4 shadow-sm hover:shadow-md animate-scale-in border border-border/40',
      'hover:-translate-y-[1px]',
      classes.accent,
      onClick && 'cursor-pointer',
      onClick && classes.hover,
      className
    )} onClick={onClick}>
      <CardContent className="p-4 py-[12px]">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <p className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">
                {value}
              </p>
              {trend && (
                <span className={cn(
                  'text-sm font-bold px-2 py-1 rounded-full border',
                  trend.isPositive 
                    ? 'text-green-700 bg-green-50 border-green-200' 
                    : 'text-red-700 bg-red-50 border-red-200'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-2xl border',
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
