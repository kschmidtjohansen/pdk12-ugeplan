
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
  title, value, total, subtitle, icon: Icon, onClick, color = 'blue', className
}) => {
  return (
    <Card 
      className={cn('glass-card card-hover-glow cursor-pointer', className)} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={`${title}: ${value}${total ? ` of ${total}` : ''}${subtitle ? `, ${subtitle}` : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="text-2xl font-semibold tracking-tight">
          {value}
          {total && <span className="text-sm text-muted-foreground ml-1">/ {total}</span>}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

export default InteractiveMetricCard;
