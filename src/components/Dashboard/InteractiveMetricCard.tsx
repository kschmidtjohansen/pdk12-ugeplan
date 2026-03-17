
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
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-200 border-l-4 shadow-sm hover:shadow-md cursor-pointer border border-border/40',
        'min-h-[120px] hover:-translate-y-[1px]',
        classes.accent,
        classes.hover,
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 sm:px-6 pt-4">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn(
          'p-2.5 sm:p-2 rounded-xl border',
          classes.icon
        )}>
          <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
        </div>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6 pb-4">
        <div className="text-2xl sm:text-xl font-bold">
          {value}
          {total && (
            <span className="text-sm sm:text-xs text-muted-foreground ml-1">
              / {total}
            </span>
          )}
        </div>
        
        {subtitle && (
          <p className="text-sm sm:text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMetricCard;
