import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, X, Check, SlidersHorizontal, Search } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import ProximityPanel from './ProximityPanel';
import { cn } from '@/lib/utils';

interface PlannerFilterBarProps {
  employees: Employee[];
  selectedEmployeeIds: string[];
  onSelectedEmployeeIdsChange: (ids: string[]) => void;
  postcode: string;
  onPostcodeChange: (value: string) => void;
  weekAssignments: Assignment[];
  weekDates: { start: Date; end: Date; startStr: string; endStr: string };
  showProximity?: boolean;
  /** Free-text quick search across case number, title, customer and employees. */
  query?: string;
  onQueryChange?: (value: string) => void;
  onClearAll?: () => void;
  additionalFiltersActive?: boolean;
}

/**
 * Compact filter bar above the week list: quick search, multi-select employee
 * filter and a postcode lookup that ranks employees by proximity.
 */
const PlannerFilterBar: React.FC<PlannerFilterBarProps> = ({
  employees,
  selectedEmployeeIds,
  onSelectedEmployeeIdsChange,
  postcode,
  onPostcodeChange,
  weekAssignments,
  weekDates,
  showProximity = true,
  query = '',
  onQueryChange,
  onClearAll,
  additionalFiltersActive = false,
}) => {
  const { t } = useTranslation();
  const { userSubDepartments, selectedSubDepartmentId } = useDepartment();

  // In the Fugt sub-department the postcode lookup only ranks fugtteknikere
  const onlyFugtteknikere = useMemo(() => {
    if (!selectedSubDepartmentId) return false;
    const sub = (userSubDepartments || []).find((s) => s.id === selectedSubDepartmentId);
    return !!sub?.name && sub.name.toLowerCase().includes('fugt');
  }, [userSubDepartments, selectedSubDepartmentId]);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const sortedEmployees = useMemo(
    () => [...employees].sort((a, b) => a.name.localeCompare(b.name)),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedEmployees;
    return sortedEmployees.filter((e) => e.name.toLowerCase().includes(q));
  }, [sortedEmployees, search]);


  const selectedSet = useMemo(() => new Set(selectedEmployeeIds), [selectedEmployeeIds]);
  const hasFilters = selectedEmployeeIds.length > 0 || !!postcode.trim() || !!query.trim() || additionalFiltersActive;

  const toggleEmployee = (id: string) => {
    onSelectedEmployeeIdsChange(
      selectedSet.has(id) ? selectedEmployeeIds.filter((e) => e !== id) : [...selectedEmployeeIds, id]
    );
  };

  const clearAll = () => {
    onSelectedEmployeeIdsChange([]);
    onPostcodeChange('');
    onQueryChange?.('');
    onClearAll?.();
  };

  // The panel is only visible while explicitly expanded. When a filter is
  // first activated we auto-expand once, but the user can always hide the
  // panel again — active filters stay visible as chips in the bar above.
  const prevHasFilters = useRef(hasFilters);
  useEffect(() => {
    if (hasFilters && !prevHasFilters.current) setExpanded(true);
    prevHasFilters.current = hasFilters;
  }, [hasFilters]);

  const isOpen = expanded;

  // "/" focuses the quick search from anywhere on the planner page.
  const queryInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!onQueryChange) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || el?.isContentEditable) return;
      e.preventDefault();
      queryInputRef.current?.focus();
      queryInputRef.current?.select();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onQueryChange]);

  return (
    <div className="relative space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {onQueryChange && (
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={queryInputRef}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') onQueryChange(''); }}
              placeholder={t('ui.searchPlannerPlaceholder')}
              aria-label={t('ui.searchPlannerAria')}
              className="h-11 pl-9 pr-12"
            />
            {query.trim() && (
              <Button variant="ghost" size="icon"
                type="button"
                aria-label={t('ui.clearSearch')}
                onClick={() => onQueryChange('')}
                className="absolute right-0 top-1/2 h-11 w-11 -translate-y-1/2 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="min-h-11"
          aria-expanded={isOpen}
          aria-controls="planner-resource-filters"
          onClick={() => setExpanded((v) => !v)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {isOpen ? t('planner.filters.hide') : t('planner.filters.show')}
        </Button>

        {selectedEmployeeIds.length > 0 &&
          selectedEmployeeIds.map((id) => {
            const emp = employees.find((e) => e.id === id);
            if (!emp) return null;
            return (
              <Badge key={id} variant="secondary" className="min-h-11 gap-1 pl-2 pr-0">
                {emp.name}
                <Button variant="ghost" size="icon"
                  type="button"
                  aria-label={emp.name}
                  onClick={() => toggleEmployee(id)}
                  className="h-11 w-11"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}

        {postcode.trim() && (
          <Badge variant="secondary" className="min-h-11 gap-1 pl-2 pr-0">
            {t('planner.filters.postcode')} {postcode.trim()}
            <Button variant="ghost" size="icon"
              type="button"
              aria-label={t('planner.filters.postcode')}
              onClick={() => onPostcodeChange('')}
              className="h-11 w-11"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" className="min-h-11 text-muted-foreground" onClick={clearAll}>
            {t('planner.filters.clearAll')}
          </Button>
        )}
      </div>

      {isOpen && (
        /* Overlay instead of inline expansion — keeps the week list from being
           pushed down (layout shift) when the filter panel opens. The panel can
           always be closed with "Skjul", even while filters are active. */
        <div id="planner-resource-filters" className="max-h-[70vh] overflow-y-auto border-y border-border bg-card p-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover open={open} onOpenChange={setOpen} modal>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="min-h-11 justify-start sm:w-64">
                  <Users className="h-4 w-4" />
                  {selectedEmployeeIds.length > 0
                    ? t('planner.filters.employeesSelected', { count: selectedEmployeeIds.length })
                    : t('planner.filters.employees')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <div className="p-2 border-b border-border">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('planner.filters.employeesPlaceholder')}
                    className="h-8"
                  />
                </div>
                <ScrollArea className="max-h-64 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <p className="p-3 text-xs text-muted-foreground">{t('planner.filters.noEmployees')}</p>
                  ) : (
                    <ul className="p-1">
                      {filteredEmployees.map((emp) => (
                        <li key={emp.id}>
                          <Button variant="ghost"
                            type="button"
                            onClick={() => toggleEmployee(emp.id)}
                            className="flex min-h-11 h-auto w-full justify-start gap-2 px-2 py-1.5 text-sm text-left"
                          >
                            <Checkbox checked={selectedSet.has(emp.id)} className="pointer-events-none" />
                            <span className="truncate">{emp.name}</span>
                            {selectedSet.has(emp.id) && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {showProximity && (
              <div className="relative sm:w-56">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  value={postcode}
                  onChange={(e) => onPostcodeChange(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('planner.filters.postcodePlaceholder')}
                  aria-label={t('planner.filters.postcode')}
                  className={cn('pl-9 h-11')}
                />
              </div>
            )}
          </div>

          {showProximity && (
            <ProximityPanel
              postcode={postcode}
              employees={employees}
              weekAssignments={weekAssignments}
              weekDates={weekDates}
              onlyFugtteknikere={onlyFugtteknikere}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PlannerFilterBar;
