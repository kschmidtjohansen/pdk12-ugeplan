import VacationList from './VacationList';
import VacationGridOverview from './VacationGridOverview';
import React from 'react';
import { Vacation } from '@/types/vacation';
import { filterVacations, visibleVacations } from '@/utils/moduleListFilters';
import { useTranslation } from '@/context/TranslationContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import ListSkeleton from '@/components/shared/ListSkeleton';
import { Search, X, CalendarDays } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface VacationTabContentProps {
  search?: string;
  onSearch?: (value: string) => void;
  onReset?: () => void;
  tabValue: string;
  vacations: Vacation[];
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
  onEdit: (vacation: Vacation) => void;
  onDelete: (vacation: Vacation) => void;
  isLoading?: boolean;
}

const VacationTabContent: React.FC<VacationTabContentProps> = ({
  search = '', onSearch, onReset,
  tabValue,
  vacations,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const { user, isEffectiveAdmin, isEffectiveServicemedarbejder } = useAuth();
  
  const { currentLanguage } = useTranslation();
  const da = currentLanguage === 'da';
  const visible = React.useMemo(() => visibleVacations(vacations, user?.id, isEffectiveAdmin, isEffectiveServicemedarbejder), [vacations, user?.id, isEffectiveAdmin, isEffectiveServicemedarbejder]);
  const filteredVacations = React.useMemo(() => filterVacations(visible, tabValue, search, user?.id), [visible, tabValue, search, user?.id]);

  if (tabValue === 'calendar') {
    return (
      <div className="mt-4 min-w-0">
        <VacationGridOverview />
      </div>
    );
  }

  return (
    <section id={`vacation-panel-${tabValue}`} aria-label={da ? 'Anmodninger' : 'Requests'} className="mt-4 min-w-0">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm"><Search aria-hidden className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" aria-label={da ? 'Søg navn, årsag eller dato' : 'Search name, reason or date'} placeholder={da ? 'Søg navn, årsag eller dato' : 'Search name, reason or date'} value={search} onChange={e => onSearch?.(e.target.value)} className="h-11 pl-9" />
        </div>
        <p role="status" className="flex-1 text-xs text-muted-foreground tabular-nums">{da ? `Viser ${filteredVacations.length} af ${visible.length}` : `Showing ${filteredVacations.length} of ${visible.length}`}</p>
        <Button variant="ghost" className="min-h-11 gap-2" disabled={tabValue === 'all' && !search.trim()} onClick={onReset}><X aria-hidden className="h-4 w-4" />{da ? 'Ryd filtre' : 'Clear filters'}</Button>
      </div>
      {isLoading ? <ListSkeleton /> : filteredVacations.length === 0 ? <EmptyState icon={<CalendarDays className="h-8 w-8 text-muted-foreground" />}
        title={visible.length ? (da ? 'Ingen anmodninger matcher' : 'No matching requests') : (da ? 'Ingen anmodninger endnu' : 'No requests yet')}
        description={visible.length ? (da ? 'Vælg en anden status eller ryd søgningen.' : 'Select another status or clear the search.') : undefined}
        action={visible.length && onReset ? { label: da ? 'Ryd filtre' : 'Clear filters', onClick: onReset } : undefined} /> : <VacationList
        vacations={filteredVacations} onApprove={onApprove} onReject={onReject} onEdit={onEdit} onDelete={onDelete} isLoading={isLoading} />}
    </section>
  );
};

export default VacationTabContent;
