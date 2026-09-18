import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, X, Check, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
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
}

/**
 * Compact filter bar above the week list: multi-select employee filter and a
 * postcode lookup that ranks employees by proximity.
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
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const sortedEmployees = useMemo(
    () => [...employees].sort((a, b) => a.name.localeCompare(b.name)),
    [employees]
  );

  const selectedSet = useMemo(() => new Set(selectedEmployeeIds), [selectedEmployeeIds]);
  const hasFilters = selectedEmployeeIds.length > 0 || !!postcode.trim();

  const toggleEmployee = (id: string) => {
    onSelectedEmployeeIdsChange(
      selectedSet.has(id) ? selectedEmployeeIds.filter((e) => e !== id) : [...selectedEmployeeIds, id]
    );
  };

  const clearAll = () => {
    onSelectedEmployeeIdsChange([]);
    onPostcodeChange('');
  };

  const isOpen = expanded || hasFilters;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
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
              <Badge key={id} variant="secondary" className="h-7 gap-1 pl-2 pr-1">
                {emp.name}
                <button
                  type="button"
                  aria-label={emp.name}
                  onClick={() => toggleEmployee(id)}
                  className="rounded p-0.5 hover:bg-background/60"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}

        {postcode.trim() && (
          <Badge variant="secondary" className="h-7 gap-1 pl-2 pr-1">
            {t('planner.filters.postcode')} {postcode.trim()}
            <button
              type="button"
              aria-label={t('planner.filters.postcode')}
              onClick={() => onPostcodeChange('')}
              className="rounded p-0.5 hover:bg-background/60"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={clearAll}>
            {t('planner.filters.clearAll')}
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover open={open} onOpenChange={setOpen} modal>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 justify-start sm:w-64">
                  <Users className="h-4 w-4" />
                  {selectedEmployeeIds.length > 0
                    ? t('planner.filters.employeesSelected', { count: selectedEmployeeIds.length })
                    : t('planner.filters.employees')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Command>
                  <CommandInput placeholder={t('planner.filters.employeesPlaceholder')} />
                  <CommandList>
                    <CommandEmpty>{t('planner.filters.noEmployees')}</CommandEmpty>
                    <CommandGroup>
                      {sortedEmployees.map((emp) => (
                        <CommandItem key={emp.id} value={emp.name} onSelect={() => toggleEmployee(emp.id)}>
                          <Checkbox checked={selectedSet.has(emp.id)} className="mr-2" />
                          <span className="truncate">{emp.name}</span>
                          {selectedSet.has(emp.id) && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
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
                  className={cn('pl-9 h-9')}
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
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PlannerFilterBar;
