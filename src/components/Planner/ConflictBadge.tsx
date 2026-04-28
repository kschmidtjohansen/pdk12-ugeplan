import React from 'react';
import { AlertTriangle, Users, Car as CarIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AssignmentConflict } from '@/utils/assignmentConflicts';
import { cn } from '@/lib/utils';

interface ConflictBadgeProps {
  conflicts: AssignmentConflict[];
  size?: 'sm' | 'md';
  className?: string;
}

const ConflictBadge: React.FC<ConflictBadgeProps> = ({ conflicts, size = 'md', className }) => {
  if (!conflicts || conflicts.length === 0) return null;

  // Dedupe by (kind, resourceId, withAssignmentId)
  const seen = new Set<string>();
  const unique = conflicts.filter(c => {
    const k = `${c.kind}:${c.resourceId}:${c.withAssignmentId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="status"
            aria-label="Booking conflict"
            className={cn(
              'inline-flex items-center gap-1 rounded-md font-semibold cursor-help chip-glass-destructive',
              size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
              className,
            )}
          >
            <AlertTriangle className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
            <span className="tabular-nums">{unique.length}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm space-y-1.5">
          <p className="font-semibold text-xs">Dobbeltbooking</p>
          <ul className="space-y-1 text-xs">
            {unique.slice(0, 6).map((c, i) => (
              <li key={i} className="flex items-start gap-1.5">
                {c.kind === 'employee'
                  ? <Users className="h-3 w-3 mt-0.5 shrink-0" />
                  : <CarIcon className="h-3 w-3 mt-0.5 shrink-0" />}
                <span>
                  <span className="font-medium">{c.resourceName}</span>
                  {' · '}
                  <span className="text-muted-foreground">{c.withTitle} ({c.withTime.from}–{c.withTime.to})</span>
                </span>
              </li>
            ))}
            {unique.length > 6 && (
              <li className="text-muted-foreground">+{unique.length - 6} flere…</li>
            )}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConflictBadge;
