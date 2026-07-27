import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CarData } from './types';
import { useTranslation } from '@/context/TranslationContext';
import { useToast } from '@/hooks/use-toast';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';
import { CarUnavailabilityService, CarUnavailability } from '@/services/carUnavailabilityService';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: CarData | null;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const CarScheduledUnavailabilityDialog: React.FC<Props> = ({ open, onOpenChange, car }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedDepartmentId } = useDepartment();
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState<string>(today());
  const [endDate, setEndDate] = useState<string>(today());
  const [reason, setReason] = useState<string>('Værkstedsbesøg');
  const [notes, setNotes] = useState<string>('');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [existing, setExisting] = useState<CarUnavailability[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !car) return;
    setStartDate(today());
    setEndDate(today());
    setReason('Værkstedsbesøg');
    setNotes('');
    CarUnavailabilityService.listForCar(car.id).then(setExisting).catch(() => setExisting([]));
  }, [open, car]);

  // Check conflicts on date change
  useEffect(() => {
    if (!open || !car || !startDate || !endDate || endDate < startDate) {
      setConflicts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: p } = await supabase
          .from('assignments')
          .select('id, title, assignment_date, from_time, to_time')
          .eq('car_id', car.id)
          .gte('assignment_date', startDate)
          .lte('assignment_date', endDate);
        const { data: m } = await supabase
          .from('assignments')
          .select('id, title, assignment_date, from_time, to_time')
          .contains('car_ids', [car.id])
          .gte('assignment_date', startDate)
          .lte('assignment_date', endDate);
        const merged = [...(p || []), ...(m || [])];
        const dedup = Array.from(new Map(merged.map((a: any) => [a.id, a])).values());
        if (!cancelled) setConflicts(dedup);
      } catch {
        if (!cancelled) setConflicts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, car, startDate, endDate]);

  const activeExisting = useMemo(
    () => existing.filter((p) => p.released_at === null && p.end_date >= today()),
    [existing]
  );

  const handleSubmit = async () => {
    if (!car) return;
    if (endDate < startDate) {
      toast({ title: t('common.error'), description: 'Slutdato skal være efter startdato', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await CarUnavailabilityService.create({
        car_id: car.id,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || 'Værkstedsbesøg',
        notes: notes.trim() || null,
        department_id: selectedDepartmentId ?? null,
      });

      // Cleanup conflicting assignments
      const removed = await CarUnavailabilityService.cleanupAssignments(car.id, startDate, endDate);

      // If starts today or earlier, mark unavailable immediately
      if (startDate <= today()) {
        await supabase
          .from('cars')
          .update({ is_available: false, updated_at: new Date().toISOString() })
          .eq('id', car.id);
      }

      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car-unavailability'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });

      toast({
        title: 'Værkstedsbesøg registreret',
        description:
          removed > 0
            ? `${car.name} er markeret som ikke tilgængelig. ${removed} opgave(r) er opdateret.`
            : `${car.name} er markeret som ikke tilgængelig i perioden.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: t('common.error'), description: err?.message || 'Kunne ikke gemme', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async (id: string) => {
    if (!car) return;
    try {
      await CarUnavailabilityService.release(id);
      await supabase
        .from('cars')
        .update({ is_available: true, updated_at: new Date().toISOString() })
        .eq('id', car.id);
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car-unavailability'] });
      setExisting((prev) => prev.map((p) => (p.id === id ? { ...p, released_at: new Date().toISOString() } : p)));
      toast({ title: 'Frigivet', description: `${car.name} er nu tilgængelig igen.` });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err?.message || 'Fejl', variant: 'destructive' });
    }
  };

  if (!car) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Planlæg værkstedsbesøg
          </DialogTitle>
          <DialogDescription>
            {car.name} · {car.car_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start">Fra dato</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="end">Til dato</Label>
              <Input
                id="end"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Årsag</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Værkstedsbesøg"
            />
          </div>

          <div>
            <Label htmlFor="notes">Noter (valgfri)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fx værksted, kontaktperson..."
              rows={2}
            />
          </div>

          {conflicts.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-medium mb-1">
                <AlertTriangle className="h-4 w-4" />
                {conflicts.length} opgave(r) rammes af perioden
              </div>
              <p className="text-xs mb-2">Bilen fjernes automatisk fra disse opgaver.</p>
              <ul className="space-y-1 max-h-32 overflow-auto">
                {conflicts.map((c) => (
                  <li key={c.id} className="text-xs">
                    · {c.assignment_date} — {c.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeExisting.length > 0 && (
            <div className="rounded-lg border border-border p-3 text-sm">
              <div className="font-medium mb-2">Eksisterende planlægninger</div>
              <ul className="space-y-1">
                {activeExisting.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
                    <span>
                      {p.start_date} → {p.end_date} · {p.reason}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => handleRelease(p.id)}>
                      Frigiv
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Gemmer...' : 'Gem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CarScheduledUnavailabilityDialog;
