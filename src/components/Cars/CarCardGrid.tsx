import React from 'react';
import { format, parseISO } from 'date-fns';
import { da as daLocale } from 'date-fns/locale';
import { Car as CarIcon, Edit, StickyNote, ToggleLeft, ToggleRight, Trash2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/TranslationContext';
import RowActions from '@/components/shared/RowActions';
import FalckSubscriptionButton from './FalckSubscriptionButton';
import VWAssistanceButton from './VWAssistanceButton';
import { carStatusKind, type CarToday } from '@/lib/carToday';
import { TONE_CHIP } from '@/lib/employeeToday';
import { sortCarsByNumber } from '@/utils/sortCars';
import type { CarData } from './types';

type Extras = { _scheduledActive?: { end_date: string } | null };

interface Props {
  cars: CarData[];
  today: Map<string, CarToday>;
  isAdmin: boolean;
  onEdit: (car: CarData) => void;
  onDelete: (car: CarData) => void;
  onToggleAvailability: (car: CarData) => void;
  onSchedule?: (car: CarData) => void;
  onEditNote?: (car: CarData) => void;
}

/** Lærredets bilkort: nummerpladen, dagens status, hvem der kører og hvorhen, og genveje til Falck, VW og note. */
const CarCardGrid: React.FC<Props> = ({ cars, today, isAdmin, onEdit, onDelete, onToggleAvailability, onSchedule, onEditNote }) => {
  const { t, currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const fmt = (d: string) => format(parseISO(d), 'd. MMM', { locale: da ? daLocale : undefined });

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortCarsByNumber(cars).map(car => {
        const td = today.get(car.id);
        const kind = carStatusKind(car.is_available !== false, td);
        const until = (car as Extras)._scheduledActive?.end_date;
        const chip = kind === 'unavailable'
          ? { tone: 'destructive' as const, label: until ? `${da ? 'Ikke tilgængelig til' : 'Unavailable until'} ${fmt(until)}` : (da ? 'Ikke tilgængelig' : 'Unavailable') }
          : kind === 'missing' ? { tone: 'warning' as const, label: `${da ? 'Mangler hold' : 'Needs crew'} ${td?.from}` }
          : kind === 'inuse' ? { tone: 'info' as const, label: da ? 'I brug' : 'In use' }
          : { tone: 'success' as const, label: da ? 'Ledig' : 'Free' };
        const number = String(car.car_number || '').replace(/^bil\s*/i, '');
        return (
          <li key={car.id} className="facet-card flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-primary-strong/70 px-2 py-0.5 font-mono text-xs font-bold text-primary-strong">
                <CarIcon aria-hidden className="h-3.5 w-3.5" />BIL {number}
              </span>
              <span className={cn('truncate rounded-full px-2.5 py-1 text-[11px] font-semibold', TONE_CHIP[chip.tone])}>{chip.label}</span>
            </div>
            <p className="-mt-1 text-xs text-muted-foreground">{car.name}</p>
            <div className="min-h-[2.5rem] text-sm">
              {kind === 'unavailable' ? (
                <><p className="font-semibold text-foreground">–</p><p className="truncate text-xs text-muted-foreground">{car.notes || (da ? 'Ingen note' : 'No note')}</p></>
              ) : td && !td.done ? (
                <><p className="truncate font-semibold text-foreground">{td.names.length ? td.names.join(', ') : (da ? 'Intet hold endnu' : 'No crew yet')}</p>
                  <p className="truncate text-xs text-muted-foreground">{td.place}{td.until ? ` ${da ? 'til' : 'until'} ${td.until}` : ''}</p></>
              ) : (
                <><p className="font-semibold text-foreground">–</p><p className="truncate text-xs text-muted-foreground">{t('cars.notBookedToday')}</p></>
              )}
            </div>
            <div className="-mx-2 mt-auto flex items-center gap-0.5 border-t border-border pt-2">
              <FalckSubscriptionButton isAdmin={isAdmin} compact />
              <VWAssistanceButton compact />
              {onEditNote && <button type="button" onClick={() => onEditNote(car)} className="min-h-8 rounded-full px-2 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">Note</button>}
              {isAdmin && (
                <RowActions className="ml-auto" subject={`BIL ${number}`} items={[
                  { key: 'edit', label: t('common.edit'), icon: Edit, onClick: () => onEdit(car) },
                  onEditNote && { key: 'note', label: t('ui.addEditNote'), icon: StickyNote, onClick: () => onEditNote(car) },
                  { key: 'avail', label: car.is_available ? t('cars.markUnavailable') : t('cars.markAvailable'), icon: car.is_available ? ToggleLeft : ToggleRight, onClick: () => onToggleAvailability(car) },
                  onSchedule && { key: 'schedule', label: t('ui.scheduleWorkshopVisit'), icon: Wrench, onClick: () => onSchedule(car) },
                  { key: 'delete', label: t('common.delete'), icon: Trash2, onClick: () => onDelete(car), destructive: true },
                ]} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default CarCardGrid;
