import React from 'react';
import { Rows3, Rows4 } from 'lucide-react';
import PageHeader from '@/components/Layout/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import { useListDensity } from '@/hooks/useListDensity';

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
  /** Show the normal/compact row toggle (desktop tables only). Default true. */
  densityToggle?: boolean;
}

/**
 * Shared shell for data-list pages (Employees, Cars, Vacation, Warehouse).
 * Same header (department eyebrow, count, actions), filter slot and content surface on every list,
 * plus a per-browser normal/compact row density applied through data-density.
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
  densityToggle = true,
}) => {
  const { currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const [density, setDensity] = useListDensity();
  const compact = density === 'compact';
  const label = compact ? (da ? 'Normal visning' : 'Comfortable rows') : (da ? 'Kompakt visning' : 'Compact rows');

  return (
    <div className="min-h-dvh w-full bg-background" data-density={density}>
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-5">
        <PageHeader title={title} description={description} eyebrow={eyebrow} meta={meta}>
          {actions}
          {densityToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden h-9 w-9 p-0 md:inline-flex"
              aria-pressed={compact}
              aria-label={label}
              title={label}
              onClick={() => setDensity(compact ? 'comfortable' : 'compact')}
            >
              {compact ? <Rows3 className="h-4 w-4" aria-hidden /> : <Rows4 className="h-4 w-4" aria-hidden />}
            </Button>
          )}
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
