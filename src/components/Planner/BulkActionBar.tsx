import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus, X, Car as CarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  count: number;
  busy?: boolean;
  onAssignEmployee: () => void;
  onAssignCar: () => void;
  onDelete: () => void;
  onClear: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  count,
  busy = false,
  onAssignEmployee,
  onAssignCar,
  onDelete,
  onClear,
}) => {
  if (count === 0) return null;
  return (
    <div
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-40',
        'bottom-20 sm:bottom-4',
        'animate-in slide-in-from-bottom-4 duration-200'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="toolbar"
      aria-label="Bulk-handlinger"
    >
      <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2 shadow-lg">
        <span className="px-2 text-sm font-medium tabular-nums">
          {count} valgt
        </span>
        <div className="h-5 w-px bg-border" />
        <Button size="sm" variant="outline" disabled={busy} onClick={onAssignEmployee} className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" /> Tildel medarbejder
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={onAssignCar} className="gap-1.5">
          <CarIcon className="h-3.5 w-3.5" /> Tildel køretøj
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={onDelete} className="gap-1.5 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Slet valgte
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onClear} className="gap-1.5">
          <X className="h-3.5 w-3.5" /> Fjern valg
        </Button>
      </div>
    </div>
  );
};

export default BulkActionBar;
