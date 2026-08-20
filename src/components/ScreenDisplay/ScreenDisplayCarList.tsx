import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';

interface ScreenDisplayCarListProps {
  assignments: Assignment[];
}

/**
 * Kiosk overview: which employees are attached to which cars for the selected
 * day. Uses the already-fetched assignments — no extra data calls.
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
    <Card className="border border-border bg-card shadow-xs">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            {t('screenDisplay.carsAndCrew')}
          </h2>
        </div>

        <div className="divide-y divide-border/60">
          {rows.map((row) => (
            <div
              key={row.car}
              className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-semibold text-foreground text-base">{row.car}</span>
              {row.employees.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {row.employees.map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 rounded-full bg-muted text-foreground text-sm font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  {t('screenDisplay.noCrew')}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
