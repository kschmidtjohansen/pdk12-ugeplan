import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveMetricCardProps {
  title: string;
  value: number;
  total?: number;
  subtitle?: string;
  icon: LucideIcon;
  onClick: () => void;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  className?: string;
}

const InteractiveMetricCard: React.FC<InteractiveMetricCardProps> = ({
  title,
  value,
  total,
  subtitle,
  icon: Icon,
  onClick,
  color = 'blue',
  className,
}) => {
  const accentClass: Record<NonNullable<InteractiveMetricCardProps['color']>, string> = {
    blue: 'before:bg-primary',
    green: 'before:bg-success',
    orange: 'before:bg-warning',
    red: 'before:bg-destructive',
    purple: 'before:bg-info',
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-colors duration-150 cursor-pointer hover:bg-accent/40 min-h-[110px]',
        'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px]',
        accentClass[color],
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${title}: ${value}${total ? ` of ${total}` : ''}${subtitle ? `, ${subtitle}` : ''}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pl-5 pt-3">
        <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pl-5 pb-3">
        <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
          {total !== undefined && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / {total}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMetricCard;
