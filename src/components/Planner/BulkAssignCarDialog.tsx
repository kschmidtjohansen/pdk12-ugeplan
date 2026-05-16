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
import { useCars } from '@/hooks/car';

interface BulkAssignCarDialogProps {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: (carId: string) => Promise<void> | void;
}

const BulkAssignCarDialog: React.FC<BulkAssignCarDialogProps> = ({
  open,
  count,
  onClose,
  onConfirm,
}) => {
  const { cars } = useCars();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (cars || []).filter(c => c.show_in_planner !== false);
    if (!q) return list.slice(0, 100);
    return list.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.car_number?.toLowerCase().includes(q) ||
      c.number_plate?.toLowerCase().includes(q)
    ).slice(0, 100);
  }, [cars, query]);

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
          <DialogTitle>Tildel køretøj til {count} opgave{count === 1 ? '' : 'r'}</DialogTitle>
          <DialogDescription>
            Vælg et køretøj, der sættes på alle valgte opgaver.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Søg køretøj…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto rounded-md border">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">Ingen køretøjer fundet.</div>
          ) : (
            filtered.map(car => (
              <button
                key={car.id}
                type="button"
                onClick={() => setSelectedId(car.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${selectedId === car.id ? 'bg-muted font-medium' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{car.name || car.car_number}</span>
                  <span className="text-xs text-muted-foreground">{car.number_plate}</span>
                </div>
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

export default BulkAssignCarDialog;
