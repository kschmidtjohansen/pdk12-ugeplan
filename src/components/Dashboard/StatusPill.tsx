import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: React.ReactNode;
  tone?: 'default' | 'primary' | 'warning';
}

const toneMap = {
  default: 'border-border/60 bg-background/60 text-foreground hover:bg-accent/60',
  primary: 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15',
  warning: 'border-warning/40 bg-warning-soft text-warning-soft-foreground hover:bg-warning-soft/80',
};

const StatusPill = React.forwardRef<HTMLButtonElement, StatusPillProps>(
  ({ icon: Icon, label, tone = 'default', className, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex h-11 sm:h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        toneMap[tone],
        className
      )}
      {...rest}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
);
StatusPill.displayName = 'StatusPill';

export default StatusPill;
