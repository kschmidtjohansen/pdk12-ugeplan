import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAssignmentDetailsId, closeAssignmentDetails } from '@/stores/assignmentDetailsStore';
import { useTranslation } from '@/context/TranslationContext';
import { format, parseISO } from 'date-fns';
import { Loader2, MapPin, Calendar, Clock, Hash, User, Users, Car as CarIcon } from 'lucide-react';

interface Row {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  assignment_date: string;
  from_time: string;
  to_time: string;
  location: string;
  case_number: string | null;
  responsible_user_id: string | null;
  car_ids: string[] | null;
  car_id: string | null;
}

const AssignmentDetailsDialog: React.FC = () => {
  const id = useAssignmentDetailsId();
  const { currentLanguage } = useTranslation();
  const navigate = useNavigate();
  const [row, setRow] = useState<Row | null>(null);
  const [responsible, setResponsible] = useState<string | null>(null);
  const [employees, setEmployees] = useState<string[]>([]);
  const [cars, setCars] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isDa = currentLanguage === 'da';

  useEffect(() => {
    if (!id) {
      setRow(null);
      setResponsible(null);
      setEmployees([]);
      setCars([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('assignments')
        .select('id,title,description,type,assignment_date,from_time,to_time,location,case_number,responsible_user_id,car_ids,car_id')
        .eq('id', id)
        .maybeSingle();
      if (cancelled) return;
      const a = data as Row | null;
      setRow(a);
      if (a?.responsible_user_id) {
        const { data: p } = await supabase.from('profiles').select('name').eq('id', a.responsible_user_id).maybeSingle();
        if (!cancelled) setResponsible((p as any)?.name ?? null);
      } else {
        setResponsible(null);
      }
      const { data: ae } = await supabase
        .from('assignments_employees')
        .select('user_id')
        .eq('assignment_id', id);
      const userIds = ((ae as any[]) || []).map(e => e.user_id);
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('name').in('id', userIds);
        if (!cancelled) setEmployees(((profs as any[]) || []).map(p => p.name));
      } else if (!cancelled) {
        setEmployees([]);
      }
      const carIds = a?.car_ids?.length ? a.car_ids : (a?.car_id ? [a.car_id] : []);
      if (carIds.length > 0) {
        const { data: cs } = await supabase.from('cars').select('name,car_number').in('id', carIds);
        if (!cancelled) setCars(((cs as any[]) || []).map(c => c.car_number ? `${c.car_number} · ${c.name}` : c.name));
      } else if (!cancelled) {
        setCars([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleOpenInPlanner = () => {
    closeAssignmentDetails();
    navigate('/planner');
  };

  let dateStr = '';
  if (row?.assignment_date) {
    try { dateStr = format(parseISO(row.assignment_date), 'EEEE dd-MM-yyyy'); } catch { dateStr = row.assignment_date; }
  }

  return (
    <Dialog open={!!id} onOpenChange={(o) => { if (!o) closeAssignmentDetails(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {row?.title || (isDa ? 'Opgave' : 'Assignment')}
            {row?.type && <Badge variant="secondary" className="text-[10px]">{row.type}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {loading && !row ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !row ? (
          <div className="py-6 text-sm text-muted-foreground text-center">{isDa ? 'Ikke fundet' : 'Not found'}</div>
        ) : (
          <div className="space-y-2 text-sm">
            {row.case_number && (
              <div className="flex items-center gap-2"><Hash className="h-3.5 w-3.5 text-muted-foreground" /><span>{row.case_number}</span></div>
            )}
            <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span>{dateStr}</span></div>
            <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span>{row.from_time?.slice(0,5)} – {row.to_time?.slice(0,5)}</span></div>
            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{row.location}</span></div>
            {responsible && (
              <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /><span>{responsible}</span></div>
            )}
            {employees.length > 0 && (
              <div className="flex items-start gap-2"><Users className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /><span>{employees.join(', ')}</span></div>
            )}
            {cars.length > 0 && (
              <div className="flex items-start gap-2"><CarIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /><span>{cars.join(', ')}</span></div>
            )}
            {row.description && (
              <div className="pt-2 border-t border-border/50 text-muted-foreground whitespace-pre-wrap">{row.description}</div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => closeAssignmentDetails()}>{isDa ? 'Luk' : 'Close'}</Button>
          {row && <Button onClick={handleOpenInPlanner}>{isDa ? 'Åbn i Planner' : 'Open in Planner'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDetailsDialog;
