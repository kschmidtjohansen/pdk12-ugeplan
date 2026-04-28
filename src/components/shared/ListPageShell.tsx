import React from 'react';
import PageHeader from '@/components/Layout/PageHeader';
import { cn } from '@/lib/utils';

interface ListPageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  filterBar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared shell for data-list pages (Employees, Cars, Vacation, Duty, Warehouse).
 * Provides consistent header, sticky filter bar slot, and content card.
 */
const ListPageShell: React.FC<ListPageShellProps> = ({
  title,
  description,
  actions,
  filterBar,
  children,
  className,
}) => {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-5">
        <PageHeader title={title} description={description}>
          {actions}
        </PageHeader>
        {filterBar}
        <div
          className={cn(
            'rounded-xl border border-border bg-card shadow-xs overflow-hidden',
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
