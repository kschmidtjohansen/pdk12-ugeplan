import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** 'filtered' = data exists but filters hide it; shows an outline reset action. */
  variant?: 'empty' | 'filtered';
  compact?: boolean;
  className?: string;
}

/**
 * Shared empty state. Distinct from ErrorState (load failed) and ListSkeleton (loading).
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  variant = 'empty',
  compact = false,
  className,
}) => {
  return (
    <div
      role="status"
      data-variant={variant}
      className={cn('flex flex-col items-center text-center gap-3', compact ? 'py-6' : 'py-12', className)}
    >
      <div className="flex justify-center text-muted-foreground [&_svg]:h-10 [&_svg]:w-10" aria-hidden="true">
        {icon ?? <Inbox />}
      </div>
      <div className="max-w-sm">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          variant={variant === 'filtered' ? 'outline' : 'default'}
          className="min-h-11"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
