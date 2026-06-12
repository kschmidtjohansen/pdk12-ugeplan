import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';

export interface CrossBusyRange {
  from_time: string | null;
  to_time: string | null;
  sub_department_id: string | null;
}

export interface CrossBusyForDate {
  employees: Set<string>;
  cars: Set<string>;
  ranges: {
    employees: Map<string, CrossBusyRange[]>;
    cars: Map<string, CrossBusyRange[]>;
  };
}

interface UseCrossSubDeptBusyArgs {
  weekDates?: { start: Date; end: Date };
}

/**
 * Returns busy employees/cars from OTHER sub-departments (or "Alle") within
 * the same main department, so that planner availability views reflect
 * cross-sub-department bookings without showing the foreign assignments.
 */
export function useCrossSubDeptBusy({ weekDates }: UseCrossSubDeptBusyArgs) {
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();
  const [byDate, setByDate] = useState<Record<string, CrossBusyForDate>>({});

  const fromStr = weekDates?.start ? format(weekDates.start, 'yyyy-MM-dd') : null;
  const toStr = weekDates?.end ? format(weekDates.end, 'yyyy-MM-dd') : null;

  useEffect(() => {
    let cancelled = false;
    if (!selectedDepartmentId || !fromStr || !toStr) {
      setByDate({});
      return;
    }

    (async () => {
      const { data, error } = await supabase.rpc('list_cross_subdept_busy_resources', {
        p_department_id: selectedDepartmentId,
        p_date_from: fromStr,
        p_date_to: toStr,
        p_exclude_sub_department_id: selectedSubDepartmentId || null,
      });

      if (cancelled) return;
      if (error) {
        if (import.meta.env.DEV) console.error('[useCrossSubDeptBusy] RPC error:', error.message);
        setByDate({});
        return;
      }

      const acc: Record<string, CrossBusyForDate> = {};
      for (const row of (data || []) as any[]) {
        const date: string = row.assignment_date;
        if (!acc[date]) {
          acc[date] = {
            employees: new Set(),
            cars: new Set(),
            ranges: { employees: new Map(), cars: new Map() },
          };
        }
        const bucket = acc[date];
        const range: CrossBusyRange = {
          from_time: row.from_time ?? null,
          to_time: row.to_time ?? null,
          sub_department_id: row.sub_department_id ?? null,
        };
        for (const eid of (row.employee_ids || []) as string[]) {
          if (!eid) continue;
          bucket.employees.add(eid);
          const arr = bucket.ranges.employees.get(eid) || [];
          arr.push(range);
          bucket.ranges.employees.set(eid, arr);
        }
        for (const cid of (row.car_ids || []) as string[]) {
          if (!cid) continue;
          bucket.cars.add(cid);
          const arr = bucket.ranges.cars.get(cid) || [];
          arr.push(range);
          bucket.ranges.cars.set(cid, arr);
        }
      }
      setByDate(acc);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDepartmentId, selectedSubDepartmentId, fromStr, toStr]);

  return useMemo(
    () => ({
      crossBusyByDate: byDate,
      getBusyForDate: (date: string): CrossBusyForDate =>
        byDate[date] || {
          employees: new Set<string>(),
          cars: new Set<string>(),
          ranges: { employees: new Map(), cars: new Map() },
        },
    }),
    [byDate],
  );
}
