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
      <CardHeader className="brand-card-header flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold brand-dot">Vagter i dag</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {todayDuties.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Ingen vagter i dag.</p>
        ) : (
          <div className="space-y-2">
            {todayDuties.map(d => (
              <div key={d.id} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{d.type}</p>
                <p className="truncate text-sm font-semibold text-foreground">{d.name}</p>
                {d.phone && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-11" asChild>
                      <a href={`tel:${telHref(d.phone)}`}>
                        <Phone className="mr-1.5 h-4 w-4" />Ring
                      </a>
                    </Button>
                    <Button variant="outline" className="h-11" asChild>
                      <a href={`sms:${telHref(d.phone)}`}>
                        <MessageSquare className="mr-1.5 h-4 w-4" />SMS
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Collapsible open={open} onOpenChange={setOpen}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-11 w-full items-center justify-between rounded-lg border border-border/60 px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {open ? 'Skjul ugen' : 'Vis hele ugen'}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          <CollapsibleContent className="mt-2 space-y-2">
            {restOfWeek.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">Ingen flere vagter denne uge.</p>
            ) : (
              restOfWeek.map(group => (
                <div key={group.date} className="rounded-lg border border-border/40 p-2.5">
                  <p className="mb-1 text-[11px] font-medium capitalize text-muted-foreground">
                    {format(new Date(group.date + 'T00:00:00'), 'EEEE d/M', { locale: da })}
                  </p>
                  {group.items.map(i => (
                    <div key={i.id} className="flex min-h-[36px] items-center justify-between gap-2">
                      <div className="min-w-0 text-sm">
                        <span className="font-medium text-foreground">{i.name}</span>
                        <span className="text-muted-foreground"> · {i.type}</span>
                      </div>
                      {i.phone && (
                        <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" asChild aria-label="Ring">
                          <a href={`tel:${telHref(i.phone)}`}><Phone className="h-4 w-4" /></a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        <Button variant="ghost" className="h-11 w-full" onClick={() => navigate('/duty')}>
          Åbn vagtplan
        </Button>
      </CardContent>
    </Card>
  );
};

export default TodayGuardsWidget;
