import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { CalendarIcon, GraduationCap, Pencil, Trash2, Plus } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Employee } from '@/types/employee';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

interface TrainingRow {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  title: string | null;
  notes: string | null;
}

const EmployeeTrainingDialog: React.FC<Props> = ({ open, onOpenChange, employee }) => {
  const { user, isDemoMode } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const { toast } = useToast();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();

  const today = new Date();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(today);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setStartDate(new Date());
    setEndDate(new Date());
    setTitle('');
    setNotes('');
  };

  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee?.id]);

  const { data: trainings = [], refetch } = useQuery({
    queryKey: ['trainings-for-employee', employee?.id, isDemoMode],
    enabled: open && !!employee?.id,
    queryFn: async (): Promise<TrainingRow[]> => {
      const { data, error } = await supabase
        .from('trainings')
        .select('id, user_id, start_date, end_date, title, notes')
        .eq('user_id', employee!.id)
        .eq('is_demo', isDemoMode)
        .order('start_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TrainingRow[];
    },
  });

  const invalidateGrids = () => {
    qc.invalidateQueries({ queryKey: ['training-grid'] });
    qc.invalidateQueries({ queryKey: ['trainings-for-employee', employee?.id] });
    refetch();
  };

  const submit = async () => {
    if (!employee) return;
    if (endDate < startDate) {
      toast({ title: tr('ui.invalidDateRange'), description: tr('ui.endDateAfterStartDot'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        title: title.trim() || null,
        notes: notes.trim() || null,
      };
      if (editingId) {
        const { error } = await supabase.from('trainings').update(payload).eq('id', editingId);
        if (error) throw error;
        toast({ title: tr('ui.courseUpdated') });
      } else {
        const { error } = await supabase.from('trainings').insert({
          ...payload,
          user_id: employee.id,
          department_id: selectedDepartmentId ?? null,
          is_demo: isDemoMode,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
        toast({ title: tr('ui.courseRegistered'), description: tr('ui.employeeEnrolledCourse', { name: employee.name }) });
      }

      // Auto-remove employee from assignments in the training period (skip demo mode)
      if (!isDemoMode) {
        try {
          const { data: cleanup } = await supabase.functions.invoke(
            'vacation-cleanup-assignments',
            {
              body: {
                userId: employee.id,
                startDate: payload.start_date,
                endDate: payload.end_date,
                reason: 'training',
              },
            }
          );
          const removed = (cleanup as any)?.removedFromCount || 0;
          const cleared = (cleanup as any)?.clearedResponsibleCount || 0;
          if (removed > 0 || cleared > 0) {
            toast({
              title: tr('ui.assignmentsUpdated'),
              description: tr('ui.removedFromAssignmentsCourse', { name: employee.name, count: removed + cleared }),
            });
            qc.invalidateQueries({ queryKey: ['assignments'], refetchType: 'active' });
            qc.invalidateQueries({ queryKey: ['optimizedAssignments'], refetchType: 'active' });
          }
        } catch (cleanupErr: any) {
          toast({
            title: tr('ui.couldNotRemoveFromAssignments'),
            description: cleanupErr?.message ?? tr('ui.unknownErrorCheckAssignments'),
            variant: 'destructive',
          });
        }
      }

      invalidateGrids();
      resetForm();
    } catch (e: any) {
      toast({ title: tr('ui.couldNotSaveCourse'), description: e?.message ?? tr('ui.unknownError'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (t: TrainingRow) => {
    setEditingId(t.id);
    setStartDate(parseISO(t.start_date));
    setEndDate(parseISO(t.end_date));
    setTitle(t.title ?? '');
    setNotes(t.notes ?? '');
  };

  const removeTraining = async (id: string) => {
    if (!confirm(tr('ui.deleteCourseConfirm'))) return;
    try {
      const { error } = await supabase.from('trainings').delete().eq('id', id);
      if (error) throw error;
      toast({ title: tr('ui.courseDeleted') });
      if (editingId === id) resetForm();
      invalidateGrids();
    } catch (e: any) {
      toast({ title: tr('ui.couldNotDelete'), description: e?.message ?? tr('ui.unknownError'), variant: 'destructive' });
    }
  };

  const DateBtn: React.FC<{ value: Date; onChange: (d: Date) => void; label: string }> = ({ value, onChange, label }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal gap-2 w-full">
          <CalendarIcon className="h-4 w-4" />
          <span className="text-xs text-muted-foreground">{label}:</span>
          {format(value, 'd. MMM yyyy', { locale: dateLocale })}
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-warning" />
            {tr('ui.coursesFor', { name: employee?.name ?? tr('ui.employeeLower') })}
          </DialogTitle>
          <DialogDescription>
            {tr('ui.courseShownYellow')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">{tr('ui.existingCourses')}</Label>
          {trainings.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">{tr('ui.noCoursesRegistered')}</div>
          ) : (
            <ul className="space-y-1.5">
              {trainings.map((t) => (
                <li key={t.id} className={cn(
                  'flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm',
                  editingId === t.id && 'border-primary bg-primary/5'
                )}>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title || tr('ui.course')}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(t.start_date), 'd. MMM yyyy', { locale: dateLocale })} – {format(parseISO(t.end_date), 'd. MMM yyyy', { locale: dateLocale })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeTraining(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {editingId ? tr('ui.editCourse') : tr('ui.newCourse')}
            </Label>
            {editingId && (
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <Plus className="h-3.5 w-3.5 mr-1" /> {tr('ui.newShort')}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DateBtn value={startDate} onChange={setStartDate} label={tr('ui.from')} />
            <DateBtn value={endDate} onChange={setEndDate} label={tr('ui.to')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="training-title">{tr('ui.titleOptional')}</Label>
            <Input id="training-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr('ui.coursePlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="training-notes">{tr('ui.notesOptional')}</Label>
            <Textarea id="training-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{tr('common.close')}</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? tr('common.saving') : editingId ? tr('ui.updateCourse') : tr('ui.saveCourse')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeTrainingDialog;
