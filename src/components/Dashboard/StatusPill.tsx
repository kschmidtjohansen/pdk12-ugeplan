import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StatusPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: React.ReactNode;
  tone?: 'default' | 'primary' | 'warning';
}

const toneMap = {
  default: 'border-border/60 bg-background/60 text-foreground hover:bg-accent/60',
  primary: 'border-border bg-card text-info-soft-foreground hover:bg-accent',
  warning: 'border-warning/40 bg-warning-soft text-warning-soft-foreground hover:bg-warning-soft/80',
};

const StatusPill = React.forwardRef<HTMLButtonElement, StatusPillProps>(
  ({ icon: Icon, label, tone = 'default', className, ...rest }, ref) => (
    <Button
      variant="ghost"
      ref={ref}
      type="button"
      className={cn(
        'inline-flex min-h-11 h-auto items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        toneMap[tone],
        className
      )}
      {...rest}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="whitespace-normal text-left break-words">{label}</span>
    </Button>
  )
);
StatusPill.displayName = 'StatusPill';

export default StatusPill;
