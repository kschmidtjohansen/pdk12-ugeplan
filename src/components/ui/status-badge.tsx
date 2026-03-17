
import React from 'react';
import { Badge, BadgeProps } from './badge';
import { cn } from '@/lib/utils';

export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'pending' | 'approved' | 'rejected' | 'destructive';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  variant?: StatusVariant;
}

const statusStyles: Record<StatusVariant, string> = {
  default: "bg-muted text-foreground hover:bg-muted",
  success: "bg-green-100 text-green-800 hover:bg-green-100",
  warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  error: "bg-red-100 text-red-800 hover:bg-red-100",
  info: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  approved: "bg-green-100 text-green-800 hover:bg-green-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
  destructive: "bg-red-100 text-red-800 hover:bg-red-100"
};

export function StatusBadge({ variant = "default", className, ...props }: StatusBadgeProps) {
  return (
    <Badge className={cn(statusStyles[variant], className)} {...props} />
  );
}
