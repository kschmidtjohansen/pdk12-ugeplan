import React, { useMemo } from 'react';
import { Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';

interface ScreenDisplayCarListProps {
  assignments: Assignment[];
}

/**
 * Kiosk overview: which employees are attached to which cars for the selected
 * day. Compact list style so it fits below the task cards without taking over
 * the screen.
 */
export const ScreenDisplayCarList: React.FC<ScreenDisplayCarListProps> = ({ assignments }) => {
  const { t } = useTranslation();

  const rows = useMemo(() => {
    const map = new Map<string, Set<string>>();

    assignments.forEach((assignment) => {
      const cars = assignment.cars || [];
      if (cars.length === 0) return;
      const employees = (assignment.assignedEmployees || [])
        .map((e) => e?.name)
        .filter(Boolean) as string[];

      cars.forEach((car) => {
        if (!car) return;
        if (!map.has(car)) map.set(car, new Set<string>());
        const set = map.get(car)!;
        employees.forEach((name) => set.add(name));
      });
    });

    return Array.from(map.entries())
      .map(([car, employees]) => ({
        car,
        employees: Array.from(employees).sort((a, b) => a.localeCompare(b, 'da')),
      }))
      .sort((a, b) => a.car.localeCompare(b.car, 'da', { numeric: true }));
  }, [assignments]);

  if (rows.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 border-b border-border pb-1.5">
        <Car className="h-4 w-4 text-primary shrink-0" />
        <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase">
          {t('screenDisplay.carsAndCrew')}
        </h2>
        <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">
          {rows.length}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((row) => (
          <div
            key={row.car}
            className="rounded-lg border border-border/60 bg-card/50 overflow-hidden"
          >
            <div className="bg-primary/5 px-2.5 py-1 border-b border-border/40 flex items-center gap-2">
              <Car className="h-3 w-3 text-primary/70 shrink-0" />
              <span className="text-sm font-semibold text-foreground truncate">
                {row.car}
              </span>
            </div>
            <div className="px-2.5 py-1.5">
              {row.employees.length > 0 ? (
                <ul className="flex flex-wrap gap-x-3 gap-y-1">
                  {row.employees.map((name) => (
                    <li
                      key={name}
                      className="flex items-center gap-1.5 text-xs text-foreground"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="truncate">{name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  {t('screenDisplay.noCrew')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
