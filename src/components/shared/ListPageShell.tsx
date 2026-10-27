import React from 'react';
import PageHeader from '@/components/Layout/PageHeader';
import { cn } from '@/lib/utils';

interface ListPageShellProps {
  title: string;
  description?: string;
  eyebrow?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  filterBar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  workspace?: boolean;
}

/**
 * Shared shell for data-list pages (Employees, Cars, Vacation, Duty, Warehouse).
 * Provides consistent header, sticky filter bar slot, and content card.
 */
const ListPageShell: React.FC<ListPageShellProps> = ({
  title,
  description,
  eyebrow,
  meta,
  actions,
  filterBar,
  children,
  className,
  workspace = false,
}) => {
  return (
    <div className="min-h-dvh w-full bg-background">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-5">
        <PageHeader title={title} description={description} eyebrow={eyebrow} meta={meta}>
          {actions}
        </PageHeader>
        {filterBar}
        <div
          className={cn(
            workspace ? 'min-w-0 border-t border-border bg-card' : 'rounded-xl border border-border bg-card shadow-xs overflow-hidden',
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ListPageShell;
