import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceSectionProps {
  title: string;
  description?: string;
  /** Short counter/meta, e.g. "12 i alt" — rendered with tabular numbers. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Removes inner padding for edge-to-edge tables/lists. */
  flush?: boolean;
  id?: string;
}

/**
 * Design System 2.0 — one flat, labelled work surface.
 * Header row with title/meta/actions above a divider; no nested cards, no gradients.
 */
const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
  title, description, meta, actions, children, className, flush = false, id,
}) => {
  const headingId = useId();
  return (
    <section id={id} aria-labelledby={headingId} className={cn('rounded-xl border border-border bg-card', className)}>
      <header className="flex flex-col gap-2 border-b border-border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h2 id={headingId} className="text-sm font-semibold text-foreground">{title}</h2>
            {meta !== undefined && meta !== null && (
              <span className="text-xs text-muted-foreground tabular-nums">{meta}</span>
            )}
          </div>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={cn(!flush && 'p-3 sm:p-4')}>{children}</div>
    </section>
  );
};

export default WorkspaceSection;
