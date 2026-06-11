
import React from 'react';
import { Badge, BadgeProps } from './badge';
import { cn } from '@/lib/utils';

export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'pending' | 'approved' | 'rejected' | 'destructive' | 'purple';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  variant?: StatusVariant;
}

const statusStyles: Record<StatusVariant, string> = {
  default: "bg-muted text-foreground hover:bg-muted text-xs px-1.5 py-0.5",
  success: "bg-green-100 text-green-800 hover:bg-green-100 text-xs px-1.5 py-0.5",
  warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs px-1.5 py-0.5",
  error: "bg-red-100 text-red-800 hover:bg-red-100 text-xs px-1.5 py-0.5",
  info: "bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs px-1.5 py-0.5",
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs px-1.5 py-0.5",
  approved: "bg-green-100 text-green-800 hover:bg-green-100 text-xs px-1.5 py-0.5",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100 text-xs px-1.5 py-0.5",
  destructive: "bg-red-100 text-red-800 hover:bg-red-100 text-xs px-1.5 py-0.5",
  purple: "bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs px-1.5 py-0.5"
};

export function StatusBadge({ variant = "default", className, ...props }: StatusBadgeProps) {
  return (
    <Badge className={cn(statusStyles[variant], className)} {...props} />
  );
}
