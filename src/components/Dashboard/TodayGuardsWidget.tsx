import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Shield, Phone, MessageSquare, ChevronDown } from 'lucide-react';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { useEmployees } from '@/hooks/useEmployees';

const telHref = (p: string) => p.replace(/\s/g, '');

const dutyLabel = (type: string) => (type === 'skadeleder_vagt' ? 'Skadeledervagt' : 'Kørevagt');

const TodayGuardsWidget: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const todayStr = format(now, 'yyyy-MM-dd');
  const weekStart = useMemo(() => startOfWeek(now, { weekStartsOn: 1 }), [now]);
  const weekEnd = useMemo(() => endOfWeek(now, { weekStartsOn: 1 }), [now]);
  const { duties } = useDutyData(weekStart, weekEnd);
  const { employees } = useEmployees();

  const resolve = (d: any) => {
    const emp = employees.find(e => e.id === d.employee_id);
    const external = d.notes?.startsWith('EKSTERN:')
      ? d.notes.split('\n')[0].replace('EKSTERN: ', '')
      : undefined;
    return {
      id: d.id,
      date: d.duty_date as string,
      type: dutyLabel(d.duty_type),
      name: d.employee?.name || emp?.name || external || 'Ukendt',
      phone: emp?.phone as string | undefined,
    };
  };

  const todayDuties = useMemo(
    () => duties.filter(d => d.duty_date === todayStr).map(resolve),
    [duties, employees, todayStr]
  );

  const restOfWeek = useMemo(() => {
    const items = duties
      .filter(d => d.duty_date > todayStr)
      .sort((a, b) => a.duty_date.localeCompare(b.duty_date))
      .map(resolve);
    const groups: { date: string; items: ReturnType<typeof resolve>[] }[] = [];
    items.forEach(i => {
      const g = groups.find(x => x.date === i.date);
      if (g) g.items.push(i);
      else groups.push({ date: i.date, items: [i] });
    });
    return groups;
  }, [duties, employees, todayStr]);

  return (
    <Card>
      <CardHeader className="brand-card-header flex flex-row items-center justify-between py-2">
        <CardTitle className="text-sm font-semibold brand-dot">Vagter i dag</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1 py-2">
        {todayDuties.length === 0 ? (
          <p className="py-1 text-xs text-muted-foreground">Ingen vagter i dag.</p>
        ) : (
          todayDuties.map(d => (
            <div key={d.id} className="flex items-center justify-between gap-2 py-0.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight text-foreground">{d.name}</p>
                <p className="truncate text-[11px] leading-tight text-muted-foreground">{d.type}</p>
              </div>
              {d.phone && (
                <div className="flex shrink-0 items-center">
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild aria-label="Ring">
                    <a href={`tel:${telHref(d.phone)}`}><Phone className="h-3.5 w-3.5" /></a>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild aria-label="SMS">
                    <a href={`sms:${telHref(d.phone)}`}><MessageSquare className="h-3.5 w-3.5" /></a>
                  </Button>
                </div>
              )}
            </div>
          ))
        )}

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleContent className="space-y-1 border-t border-border/40 pt-1">
            {restOfWeek.length === 0 ? (
              <p className="py-1 text-xs text-muted-foreground">Ingen flere vagter denne uge.</p>
            ) : (
              restOfWeek.map(group => (
                <div key={group.date}>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {format(new Date(group.date + 'T00:00:00'), 'EEE d/M', { locale: da })}
                  </p>
                  {group.items.map(i => (
                    <div key={i.id} className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-xs">
                        <span className="font-medium text-foreground">{i.name}</span>
                        <span className="text-muted-foreground"> · {i.type}</span>
                      </p>
                      {i.phone && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" asChild aria-label="Ring">
                          <a href={`tel:${telHref(i.phone)}`}><Phone className="h-3.5 w-3.5" /></a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-center justify-between border-t border-border/40 pt-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {open ? 'Skjul ugen' : 'Vis hele ugen'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/duty')}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Åbn vagtplan
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayGuardsWidget;
