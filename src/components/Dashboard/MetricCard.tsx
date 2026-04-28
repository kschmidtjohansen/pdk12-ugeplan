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
  className,
}) => {
  // Map legacy color prop to a subtle accent stripe; otherwise neutral.
  const accentClass: Record<NonNullable<MetricCardProps['color']>, string> = {
    blue: 'before:bg-primary',
    green: 'before:bg-success',
    orange: 'before:bg-warning',
    red: 'before:bg-destructive',
    purple: 'before:bg-info',
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-colors duration-150',
        'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px]',
        accentClass[color],
        onClick && 'cursor-pointer hover:bg-accent/40',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {value}
              </p>
              {trend && (
                <span
                  className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded-md',
                    trend.isPositive
                      ? 'text-success bg-success/10'
                      : 'text-destructive bg-destructive/10'
                  )}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <div className="p-2 rounded-md bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
