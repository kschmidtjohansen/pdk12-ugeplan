import React, { useMemo } from 'react';
import { Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';

interface ScreenDisplayCarListProps {
  assignments: Assignment[];
}

/**
 * Kiosk overview: which employees are attached to which cars for the selected
 * day. Optimised for TV screens — large type, card grid, no dense rows.
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
    <section className="space-y-3">
      <div className="flex items-center gap-3 border-b border-border pb-2">
        <Car className="h-7 w-7 xl:h-8 xl:w-8 text-primary shrink-0" />
        <h2 className="text-2xl xl:text-3xl font-bold tracking-tight text-foreground">
          {t('screenDisplay.carsAndCrew')}
        </h2>
        <span className="ml-auto text-xl xl:text-2xl font-semibold text-muted-foreground tabular-nums">
          {rows.length}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {rows.map((row) => (
          <div
            key={row.car}
            className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden"
          >
            <div className="bg-primary/10 px-4 py-2.5 border-b border-border/50">
              <span className="text-xl xl:text-2xl font-bold text-foreground leading-none">
                {row.car}
              </span>
            </div>
            <div className="px-4 py-3">
              {row.employees.length > 0 ? (
                <ul className="space-y-1.5">
                  {row.employees.map((name) => (
                    <li
                      key={name}
                      className="flex items-center gap-2.5 text-lg xl:text-xl font-medium text-foreground leading-tight"
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                      <span className="truncate">{name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-lg xl:text-xl text-muted-foreground italic">
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
