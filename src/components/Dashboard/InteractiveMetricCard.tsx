
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
  className
}) => {
  const colorClasses = {
    blue: {
      icon: 'text-blue-600 bg-blue-50 border-blue-200',
      accent: 'border-l-blue-500',
      hover: 'hover:border-blue-300 hover:shadow-blue-500/20'
    },
    green: {
      icon: 'text-green-600 bg-green-50 border-green-200',
      accent: 'border-l-green-500',
      hover: 'hover:border-green-300 hover:shadow-green-500/20'
    },
    orange: {
      icon: 'text-orange-600 bg-orange-50 border-orange-200',
      accent: 'border-l-orange-500',
      hover: 'hover:border-orange-300 hover:shadow-orange-500/20'
    },
    red: {
      icon: 'text-red-600 bg-red-50 border-red-200',
      accent: 'border-l-red-500',
      hover: 'hover:border-red-300 hover:shadow-red-500/20'
    },
    purple: {
      icon: 'text-purple-600 bg-purple-50 border-purple-200',
      accent: 'border-l-purple-500',
      hover: 'hover:border-purple-300 hover:shadow-purple-500/20'
    }
  };

  const classes = colorClasses[color];

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300 border-l-4 shadow-md hover:shadow-lg cursor-pointer hover:scale-[1.01] bg-gradient-to-br from-card to-card/50 border-2 border-border/50',
      classes.accent,
      classes.hover,
      className
    )} onClick={onClick}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn(
          'p-2 rounded-xl border transition-all duration-300 hover:scale-105',
          classes.icon
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-3">
        <div className="text-xl font-bold">
          {value}
          {total && (
            <span className="text-xs text-muted-foreground ml-1">
              / {total}
            </span>
          )}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMetricCard;
