import React from 'react';
import { Separator } from '@/components/ui/separator';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Small context label above the title, e.g. department name. */
  eyebrow?: React.ReactNode;
  /** Inline meta next to the title, e.g. result count (tabular numbers). */
  meta?: React.ReactNode;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  eyebrow,
  meta,
  children
}) => {
  return (
    <div className="mb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 min-w-0">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
          )}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{title}</h1>
            {meta && <span className="text-sm text-muted-foreground tabular-nums">{meta}</span>}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
            {children}
          </div>
        )}
      </div>
      <Separator className="mt-4" />
    </div>
  );
};

export default PageHeader;
