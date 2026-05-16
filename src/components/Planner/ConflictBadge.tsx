import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AssignmentConflict } from '@/utils/assignmentConflicts';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import ConflictResolutionPopover from './ConflictResolutionPopover';
import { cn } from '@/lib/utils';

interface ConflictBadgeProps {
  conflicts: AssignmentConflict[];
  size?: 'sm' | 'md';
  className?: string;
  assignment?: Assignment;
  allAssignments?: Assignment[];
  employees?: Array<{ id: string; name: string; email?: string }>;
  cars?: Car[];
}

const ConflictBadge: React.FC<ConflictBadgeProps> = ({
  conflicts,
  size = 'md',
  className,
  assignment,
  allAssignments,
  employees,
  cars,
}) => {
  const [open, setOpen] = useState(false);

  if (!conflicts || conflicts.length === 0) return null;

  // Dedupe by (kind, resourceId, withAssignmentId)
  const seen = new Set<string>();
  const unique = conflicts.filter(c => {
    const k = `${c.kind}:${c.resourceId}:${c.withAssignmentId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const canResolve = !!(assignment && allAssignments && employees && cars);

  const trigger = (
    <button
      type="button"
      role="status"
      aria-label="Booking conflict"
      onClick={(e) => { e.stopPropagation(); }}
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-semibold chip-glass-destructive',
        canResolve ? 'cursor-pointer hover:opacity-90' : 'cursor-help',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        className,
      )}
    >
      <AlertTriangle className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span className="tabular-nums">{unique.length}</span>
    </button>
  );

  if (!canResolve) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="p-3 w-auto z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <ConflictResolutionPopover
          assignment={assignment!}
          allAssignments={allAssignments!}
          conflicts={unique}
          employees={employees!}
          cars={cars!}
          onResolved={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};

export default React.memo(ConflictBadge);
