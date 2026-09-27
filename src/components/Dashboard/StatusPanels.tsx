import React, { useState } from 'react';
import { Phone, MessageSquare, Car as CarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tel = (p: string) => p.replace(/\s/g, '');

export interface DutyPerson { id: string; type: string; name: string; phone?: string; date?: string }

const Row: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('flex min-h-[44px] items-center justify-between gap-3 border-b border-border/40 py-2 last:border-0', className)}>{children}</div>
);

const CallBtn: React.FC<{ phone?: string }> = ({ phone }) =>
  phone ? (
    <Button size="icon" variant="outline" className="h-11 w-11 shrink-0" asChild aria-label="Ring">
      <a href={`tel:${tel(phone)}`}><Phone className="h-4 w-4" /></a>
    </Button>
  ) : null;

export const DutyDetailPanel: React.FC<{ today: DutyPerson[]; upcoming: DutyPerson[]; onOpenPlan: () => void }> = ({ today, upcoming, onOpenPlan }) => (
  <div className="space-y-4">
    {today.length === 0 ? (
      <p className="text-sm text-muted-foreground">Ingen vagter i dag.</p>
    ) : (
      today.map(d => (
        <div key={d.id} className="rounded-xl border border-border/60 bg-card p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{d.type}</p>
          <p className="text-base font-semibold text-foreground">{d.name}</p>
          {d.phone && <p className="text-sm tabular-nums text-muted-foreground">{d.phone}</p>}
          {d.phone && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="brand" className="h-11" asChild><a href={`tel:${tel(d.phone)}`}><Phone className="mr-1.5 h-4 w-4" />Ring</a></Button>
              <Button variant="outline" className="h-11" asChild><a href={`sms:${tel(d.phone)}`}><MessageSquare className="mr-1.5 h-4 w-4" />SMS</a></Button>
            </div>
          )}
        </div>
      ))
    )}
    {upcoming.length > 0 && (
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Resten af ugen</p>
        {upcoming.map(d => (
          <Row key={d.id}>
            <div className="min-w-0 text-sm">
              <span className="font-medium text-foreground">{d.name}</span>
              <span className="text-muted-foreground"> · {d.type} · {d.date}</span>
            </div>
          </Row>
        ))}
      </div>
    )}
    <Button variant="ghost" className="h-11 w-full" onClick={onOpenPlan}>Åbn vagtplan</Button>
  </div>
);

type Emp = { id: string; name: string; phone?: string | null };
type Busy = Emp & { task: string };

const Segment: React.FC<{ value: 'a' | 'b'; onChange: (v: 'a' | 'b') => void; a: string; b: string }> = ({ value, onChange, a, b }) => (
  <div className="mb-3 grid grid-cols-2 rounded-lg border border-border/60 bg-muted/40 p-1">
    {(['a', 'b'] as const).map(k => (
      <button key={k} type="button" onClick={() => onChange(k)}
        className={cn('h-9 rounded-md text-sm font-medium transition-colors', value === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
        {k === 'a' ? a : b}
      </button>
    ))}
  </div>
);

export const AvailableEmployeesPanel: React.FC<{ available: Emp[]; busy: Busy[]; onShowAll: () => void }> = ({ available, busy, onShowAll }) => {
  const [seg, setSeg] = useState<'a' | 'b'>('a');
  const list = seg === 'a' ? available : busy;
  return (
    <div>
      <Segment value={seg} onChange={setSeg} a={`Ledige (${available.length})`} b={`Optaget (${busy.length})`} />
      {list.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Ingen</p>}
      {list.map(e => (
        <Row key={e.id}>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{e.name}</p>
            {'task' in e && <p className="truncate text-xs text-muted-foreground">{(e as Busy).task}</p>}
          </div>
          <CallBtn phone={e.phone ?? undefined} />
        </Row>
      ))}
      <Button variant="ghost" className="mt-2 h-11 w-full" onClick={onShowAll}>Se hele listen</Button>
    </div>
  );
};

type CarItem = { id: string; name: string; plate?: string; by?: string };

export const AvailableCarsPanel: React.FC<{ available: CarItem[]; busy: CarItem[]; onShowAll: () => void }> = ({ available, busy, onShowAll }) => {
  const [seg, setSeg] = useState<'a' | 'b'>('a');
  const list = seg === 'a' ? available : busy;
  return (
    <div>
      <Segment value={seg} onChange={setSeg} a={`Ledige (${available.length})`} b={`I brug (${busy.length})`} />
      {list.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Ingen</p>}
      {list.map(c => (
        <Row key={c.id}>
          <div className="flex min-w-0 items-center gap-2">
            <CarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.by ?? c.plate}</p>
            </div>
          </div>
        </Row>
      ))}
      <Button variant="ghost" className="mt-2 h-11 w-full" onClick={onShowAll}>Se hele listen</Button>
    </div>
  );
};

export const ExpiringTempsPanel: React.FC<{ items: { id: string; name: string; label: string }[]; onExtend: () => void }> = ({ items, onExtend }) => (
  <div>
    {items.map(i => (
      <Row key={i.id}>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{i.name}</p>
          <p className="text-xs text-warning-soft-foreground">{i.label}</p>
        </div>
        <Button size="sm" variant="outline" className="h-11" onClick={onExtend}>Forlæng</Button>
      </Row>
    ))}
  </div>
);
