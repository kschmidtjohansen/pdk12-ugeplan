import React, { Suspense, lazy, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { AlertTriangle, Car as CarIcon, Copy, MapPin, MoreHorizontal, Send, Trash2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import type { Assignment } from '@/types/assignment';
import type { AssignmentConflict } from '@/utils/assignmentConflicts';
import { assignmentTypeInfo } from './assignmentType';

const AssignmentHistoryTab = lazy(() => import('../AssignmentHistoryTab'));

interface Props {
  assignment: Assignment;
  conflicts: AssignmentConflict[];
  carLabels: string[];
  canEdit: boolean;
  canPublish: boolean;
  onEdit: () => void;
  onCopy?: () => void;
  onPublish?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

const t5 = (t?: string) => (t || '').slice(0, 5);

/** Lærredets sidepanel for den valgte opgave på Tavlen: hvad, hvor, hvem, konflikter og historik, med Rediger opgave. */
const PlannerTaskPanel: React.FC<Props> = ({ assignment: a, conflicts, carLabels, canEdit, canPublish, onEdit, onCopy, onPublish, onDelete, onClose }) => {
  const { t, currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const [tab, setTab] = useState<'details' | 'history'>('details');
  const { key } = assignmentTypeInfo(a.type);
  const when = `${format(parseISO(a.date), 'EEEE', { locale: da ? daLocale : undefined })} ${t5(a.fromTime)}–${t5(a.toTime)}`;
  const people = (a.assignedEmployees ?? []).map(e => e.name).filter(Boolean);
  const conflictText = conflicts.map(c => c.kind === 'car'
    ? (da ? `${c.resourceName} er også brugt på ${c.withTitle} ${t5(c.withTime.from)}–${t5(c.withTime.to)}.` : `${c.resourceName} is also used on ${c.withTitle} ${t5(c.withTime.from)}–${t5(c.withTime.to)}.`)
    : (da ? `${c.resourceName} er også på ${c.withTitle} ${t5(c.withTime.from)}–${t5(c.withTime.to)}.` : `${c.resourceName} is also on ${c.withTitle} ${t5(c.withTime.from)}–${t5(c.withTime.to)}.`));
  const nav = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a.location || '')}`;

  return (
    <section aria-label={da ? 'Valgt opgave' : 'Selected task'} className="facet-card overflow-hidden">
      <header className="facet-person-head relative px-5 pb-5 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-primary-strong">{t(key)}</span>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 rounded-lg bg-card/70" onClick={onClose} aria-label={da ? 'Luk' : 'Close'}><X className="h-4 w-4" /></Button>
        </div>
        <h2 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-foreground">{a.title}</h2>
        <p className="mt-1 font-mono text-xs uppercase text-primary-strong">{a.case_number ? `${da ? 'Sag' : 'Case'} ${a.case_number} · ` : ''}{when}</p>
      </header>

      <div className="space-y-4 px-5 pb-5 pt-4">
        {conflictText.length > 0 && (
          <div role="note" className="flex gap-2.5 rounded-xl bg-destructive-soft px-3 py-2.5 text-sm text-destructive-soft-foreground ring-1 ring-inset ring-destructive/20">
            <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span><strong>{da ? 'Konflikt.' : 'Conflict.'}</strong> {conflictText.join(' ')}</span>
          </div>
        )}

        <div role="tablist" aria-label={a.title} className="flex gap-4 border-b border-border">
          {(['details', 'history'] as const).map(k => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn('-mb-px min-h-10 border-b-2 text-xs font-semibold', tab === k ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {k === 'details' ? (da ? 'Detaljer' : 'Details') : (da ? 'Historik' : 'History')}
            </button>
          ))}
        </div>

        {tab === 'details' ? (
          <div role="tabpanel" className="space-y-4">
            <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
              <span className={cn('rounded-full px-2.5 py-0.5', a.published ? 'bg-success-soft text-success-soft-foreground' : 'bg-muted text-muted-foreground')}>{a.published ? (da ? 'Publiceret' : 'Published') : (da ? 'Ikke publiceret' : 'Not published')}</span>
              {a.responsibleUser?.name && <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">{da ? 'Ansvarlig' : 'Lead'}: {a.responsibleUser.name}</span>}
            </div>
            <dl className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2.5 gap-y-2.5 text-sm">
              <dt className="pt-0.5 text-muted-foreground"><MapPin aria-label={da ? 'Adresse' : 'Address'} className="h-4 w-4" /></dt>
              <dd className="flex flex-col">
                <span className="font-semibold text-foreground">{a.location || '–'}</span>
                {a.location && <a href={nav} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary-strong hover:underline">{da ? 'Naviger' : 'Navigate'}</a>}
              </dd>
              <dt className="pt-0.5 text-muted-foreground"><Users aria-label={da ? 'Hold' : 'Crew'} className="h-4 w-4" /></dt>
              <dd className={cn(!people.length && 'font-semibold text-warning-soft-foreground')}>{people.length ? people.join(', ') : (da ? 'Mangler hold' : 'Needs crew')}</dd>
              <dt className="pt-0.5 text-muted-foreground"><CarIcon aria-label={da ? 'Bil' : 'Car'} className="h-4 w-4" /></dt>
              <dd className={cn('font-mono text-[13px]', !carLabels.length && 'font-semibold text-warning-soft-foreground')}>{carLabels.length ? carLabels.join(' · ') : (da ? 'Mangler bil' : 'No car')}</dd>
            </dl>
            {a.description && <p className="whitespace-pre-wrap rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{a.description}</p>}
          </div>
        ) : (
          <div role="tabpanel"><Suspense fallback={<p className="text-sm text-muted-foreground">…</p>}><AssignmentHistoryTab assignment={a} /></Suspense></div>
        )}

        {canEdit && (
          <div className="flex gap-2">
            <Button className="min-h-11 flex-1 rounded-xl" onClick={onEdit}>{da ? 'Rediger opgave' : 'Edit task'}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-11 w-11 rounded-xl" aria-label={da ? 'Flere handlinger' : 'More actions'}><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onCopy && <DropdownMenuItem onSelect={onCopy}><Copy className="h-4 w-4" />{da ? 'Kopiér' : 'Copy'}</DropdownMenuItem>}
                {canPublish && !a.published && onPublish && <DropdownMenuItem onSelect={onPublish}><Send className="h-4 w-4" />{da ? 'Publicér' : 'Publish'}</DropdownMenuItem>}
                {onDelete && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />{da ? 'Slet' : 'Delete'}</DropdownMenuItem></>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </section>
  );
};

export default PlannerTaskPanel;
