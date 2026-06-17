import React, { useState } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { CalendarIcon, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useQueryClient } from '@tanstack/react-query';
import type { Employee } from '@/types/employee';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

const EmployeeTrainingDialog: React.FC<Props> = ({ open, onOpenChange, employee }) => {
  const { user, isDemoMode } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const { toast } = useToast();
  const qc = useQueryClient();

  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(today);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) {
      setStartDate(today);
      setEndDate(today);
      setTitle('');
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!employee) return;
    if (endDate < startDate) {
      toast({ title: 'Ugyldigt datointerval', description: 'Slutdato skal være efter startdato.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('trainings').insert({
        user_id: employee.id,
        department_id: selectedDepartmentId ?? null,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        title: title.trim() || null,
        notes: notes.trim() || null,
        is_demo: isDemoMode,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      toast({ title: 'Kursus registreret', description: `${employee.name} er meldt på kursus.` });
      qc.invalidateQueries({ queryKey: ['training-grid'] });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Kunne ikke gemme kursus', description: e?.message ?? 'Ukendt fejl', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const DateBtn: React.FC<{ value: Date; onChange: (d: Date) => void; label: string }> = ({ value, onChange, label }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal gap-2 w-full">
          <CalendarIcon className="h-4 w-4" />
          <span className="text-xs text-muted-foreground">{label}:</span>
          {format(value, 'd. MMM yyyy', { locale: da })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => d && onChange(d)}
          initialFocus
          weekStartsOn={1}
          locale={da}
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-yellow-600" />
            Meld {employee?.name ?? 'medarbejder'} på kursus
          </DialogTitle>
          <DialogDescription>
            Kursus vises som gul markering i ferieoversigten.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <DateBtn value={startDate} onChange={setStartDate} label="Fra" />
            <DateBtn value={endDate} onChange={setEndDate} label="Til" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="training-title">Titel (valgfri)</Label>
            <Input id="training-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="f.eks. Asbestkursus" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="training-notes">Noter (valgfri)</Label>
            <Textarea id="training-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annuller</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Gemmer...' : 'Gem kursus'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeTrainingDialog;
