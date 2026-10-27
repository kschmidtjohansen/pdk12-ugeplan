
import React from 'react';
import { Badge, BadgeProps } from './badge';
import { cn } from '@/lib/utils';

export type StatusVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'destructive'
  | 'purple';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  variant?: StatusVariant;
  /** Adds a small leading dot; the text label must still carry the meaning. */
  dot?: boolean;
}

/** Shared sizing so every status label across the app looks identical. */
const base =
  'text-xs font-medium px-1.5 py-0.5 border border-transparent shadow-none';

const statusStyles: Record<StatusVariant, string> = {
  default: 'bg-muted text-foreground hover:bg-muted',
  success: 'bg-success-soft text-success-soft-foreground hover:bg-success-soft',
  warning: 'bg-warning-soft text-warning-soft-foreground hover:bg-warning-soft',
  error: 'bg-destructive-soft text-destructive-soft-foreground hover:bg-destructive-soft',
  info: 'bg-info-soft text-info-soft-foreground hover:bg-info-soft',
  pending: 'bg-warning-soft text-warning-soft-foreground hover:bg-warning-soft',
  approved: 'bg-success-soft text-success-soft-foreground hover:bg-success-soft',
  rejected: 'bg-destructive-soft text-destructive-soft-foreground hover:bg-destructive-soft',
  destructive: 'bg-destructive-soft text-destructive-soft-foreground hover:bg-destructive-soft',
  purple: 'bg-accent-soft text-accent-soft-foreground hover:bg-accent-soft',
};

export function StatusBadge({ variant = 'default', className, dot = false, children, ...props }: StatusBadgeProps) {
  return (
    <Badge data-status={variant} className={cn(base, dot && 'gap-1.5', statusStyles[variant], className)} {...props}>
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </Badge>
  );
}
