import { LiveDot } from '@/components/ui/live-dot';
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StatusPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: React.ReactNode;
  tone?: 'default' | 'primary' | 'warning';
  /** Show a pulsing live dot (e.g. person on duty right now). */
  live?: boolean;
}

const toneMap = {
  default: 'facet-tile text-foreground',
  primary: 'facet-tile text-primary-strong',
  warning: 'facet-tile facet-tile-warning text-warning-soft-foreground',
};

const StatusPill = React.forwardRef<HTMLButtonElement, StatusPillProps>(
  ({ icon: Icon, label, tone = 'default', live = false, className, ...rest }, ref) => (
    <Button
      variant="ghost"
      ref={ref}
      type="button"
      className={cn(
        'inline-flex min-h-12 h-auto items-center justify-start gap-2 rounded-card px-3.5 py-2.5 text-sm font-medium tabular-nums transition-[background-color,box-shadow,transform] duration-140 ease-facet focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        toneMap[tone],
        className
      )}
      {...rest}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="whitespace-normal text-left break-words">{label}</span>
      {live && <LiveDot className="ml-auto" />}
    </Button>
  )
);
StatusPill.displayName = 'StatusPill';

export default StatusPill;
