import React from 'react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';

export interface RowAction {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  /** Red text in the menu, behind a separator (Slet). Never shown as a loose button. */
  destructive?: boolean;
  disabled?: boolean;
}

interface RowActionsProps {
  /** The one action shown directly on the row (usually Redigér). */
  primary?: RowAction;
  /** Everything else, in the order it should appear in the menu. */
  items: Array<RowAction | false | null | undefined>;
  /** Name of the row's subject, for screen readers: "Flere handlinger for Betina Poulsen". */
  subject?: string;
  className?: string;
}

/**
 * The row actions used across PolyPlan's lists: one visible action plus a "…" menu with text labels.
 * Destructive actions only live in the menu, so they cannot be hit by accident while scanning a list.
 */
const RowActions: React.FC<RowActionsProps> = ({ primary, items, subject, className }) => {
  const { t } = useTranslation();
  const list = items.filter(Boolean) as RowAction[];
  const normal = list.filter(a => !a.destructive);
  const danger = list.filter(a => a.destructive);
  const more = t('common.moreActions');
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();   // rows and cards are often clickable themselves

  return (
    <div className={cn('flex items-center justify-end gap-1', className)} onClick={stop} onKeyDown={stop}>
      {primary && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={primary.onClick} disabled={primary.disabled}
                aria-label={subject ? `${primary.label}: ${subject}` : primary.label}>
                <primary.icon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{primary.label}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {list.length > 0 && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" aria-label={subject ? `${more} for ${subject}` : more}>
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            {normal.map(a => (
              <DropdownMenuItem key={a.key} onSelect={() => a.onClick()} disabled={a.disabled} className="cursor-pointer gap-2">
                <a.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span>{a.label}</span>
              </DropdownMenuItem>
            ))}
            {danger.length > 0 && normal.length > 0 && <DropdownMenuSeparator />}
            {danger.map(a => (
              <DropdownMenuItem key={a.key} onSelect={() => a.onClick()} disabled={a.disabled}
                className="cursor-pointer gap-2 text-destructive focus:bg-destructive-soft focus:text-destructive">
                <a.icon className="h-4 w-4" aria-hidden="true" />
                <span>{a.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default RowActions;
