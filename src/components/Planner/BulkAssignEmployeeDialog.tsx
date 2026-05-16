import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEmployees } from '@/hooks/useEmployees';

interface BulkAssignEmployeeDialogProps {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void> | void;
}

const BulkAssignEmployeeDialog: React.FC<BulkAssignEmployeeDialogProps> = ({
  open,
  count,
  onClose,
  onConfirm,
}) => {
  const { employees } = useEmployees();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = employees || [];
    if (!q) return list.slice(0, 50);
    return list.filter(e => e.name?.toLowerCase().includes(q)).slice(0, 50);
  }, [employees, query]);

  const handleConfirm = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await onConfirm(selectedId);
      onClose();
      setSelectedId(null);
      setQuery('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tildel medarbejder til {count} opgave{count === 1 ? '' : 'r'}</DialogTitle>
          <DialogDescription>
            Vælg en medarbejder, der tilføjes til alle valgte opgaver.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Søg medarbejder…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto rounded-md border">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">Ingen medarbejdere fundet.</div>
          ) : (
            filtered.map(emp => (
              <button
                key={emp.id}
                type="button"
                onClick={() => setSelectedId(emp.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${selectedId === emp.id ? 'bg-muted font-medium' : ''}`}
              >
                {emp.name}
              </button>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Annullér</Button>
          <Button onClick={handleConfirm} disabled={!selectedId || busy}>
            {busy ? 'Tildeler…' : 'Tildel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAssignEmployeeDialog;
