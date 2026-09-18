import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDepartment } from '@/context/DepartmentContext';
import { fetchPostnrCoords } from '@/hooks/useDawaPostnrLookup';
import { haversineDistanceKm } from '@/utils/haversine';
import { useVacations } from '@/hooks/useVacations';
import { useActiveTrainingsForRange } from '@/hooks/useActiveTrainings';
import { getAllWeekDays } from '@/utils/dates';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { estimateTravelMinutes } from '@/utils/travelTime';


export interface ProximityDayInfo {
  /** yyyy-MM-dd */
  date: string;
  /** true when the employee is on vacation / training / sick that day */
  absent: boolean;
  /** number of assignments that day */
  assignmentCount: number;
  /** end time of the last assignment that day (HH:MM), null when free all day */
  freeFrom: string | null;
  /** end of the 8-hour working day (HH:MM) */
  dayEnd: string;
  /** free minutes left after the last assignment (0 when absent) */
  freeMinutes: number;
  /** true when at least 60 free minutes are left and the employee is present */
  hasEnoughFree: boolean;
  /**
   * Distance in km from the searched postcode to where the employee ends the day:
   * that day's last assignment, or the home address when not booked.
   */
  originDistanceKm: number | null;
  /** estimated travel time in minutes for originDistanceKm */
  originTravelMin: number | null;
  /** which point originDistanceKm was measured from */
  origin: 'assignment' | 'home' | null;
}

export interface ProximityResult {
  employee: Employee;
  /** distance from the employee's home address */
  homeDistanceKm: number | null;
  /** estimated travel time in minutes from the employee's home address */
  homeTravelMin: number | null;
  /** shortest per-day origin distance, preferring days with enough free time */
  bestDistanceKm: number | null;
  /** estimated travel time in minutes for the shortest distance */
  bestTravelMin: number | null;
  /** 'home' | 'assignment' | null — which distance the ranking is based on */
  bestSource: 'home' | 'assignment' | null;
  days: ProximityDayInfo[];
  /** true when the employee is available (not absent) at least one day this week */
  hasAvailableDay: boolean;
  /** true when at least one day has 1 hour or more free */
  hasEnoughFreeDay: boolean;
}



interface Params {
  postcode: string;
  employees: Employee[];
  weekAssignments: Assignment[];
  weekDates: { start: Date; end: Date; startStr: string; endStr: string };
  enabled?: boolean;
  /** When true (Fugt sub-department), only fugttekniker employees are ranked */
  onlyFugtteknikere?: boolean;
}

const isValidPostcode = (p: string) => /^\d{4}$/.test((p || '').trim());

/** 8-hour working day; a day with less than 1 hour left counts as busy */
const WORKDAY_MINUTES = 8 * 60;
const MIN_FREE_MINUTES = 60;
const DEFAULT_DAY_START = 7 * 60;

const toMinutes = (time?: string | null): number | null => {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hh = Number(h);
  const mm = Number(m);
  if (!isFinite(hh) || !isFinite(mm)) return null;
  return hh * 60 + mm;
};

const toHHMM = (minutes: number): string => {
  const total = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};


/**
 * Looks up the centre of a Danish postcode and ranks employees by how close they
 * are — measured both from their home address and from the assignments they are
 * on during the displayed week. Purely a lookup tool: nothing is written back.
 */
export const useProximitySearch = ({
  postcode,
  employees,
  weekAssignments,
  weekDates,
  enabled = true,
  onlyFugtteknikere = false,
}: Params) => {
  const { selectedDepartmentId } = useDepartment();
  const { vacations } = useVacations();
  const { trainingIds } = useActiveTrainingsForRange(weekDates.startStr, weekDates.endStr);

  const active = enabled && isValidPostcode(postcode);

  const coordsQuery = useQuery({
    queryKey: ['postnr-coords', postcode.trim()],
    enabled: active,
    queryFn: () => fetchPostnrCoords(postcode.trim()),
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Sick days for the whole week (only readable by privileged roles — errors are
  // swallowed so the panel still works for everyone else).
  const sickQuery = useQuery({
    queryKey: ['sick-days-range', selectedDepartmentId, weekDates.startStr, weekDates.endStr],
    enabled: active && !!selectedDepartmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sick_days')
        .select('user_id, sick_date')
        .eq('department_id', selectedDepartmentId!)
        .gte('sick_date', weekDates.startStr)
        .lte('sick_date', weekDates.endStr);
      if (error) return new Map<string, Set<string>>();
      const map = new Map<string, Set<string>>();
      (data || []).forEach((row: any) => {
        if (!map.has(row.sick_date)) map.set(row.sick_date, new Set());
        map.get(row.sick_date)!.add(row.user_id);
      });
      return map;
    },
    staleTime: 60 * 1000,
  });

  const results = useMemo<ProximityResult[]>(() => {
    const target = coordsQuery.data;
    if (!active || !target) return [];

    // Weekdays only — Saturday and Sunday are irrelevant for the lookup
    const weekDays = getAllWeekDays({ start: weekDates.start, end: weekDates.end }).filter(
      (date) => {
        const dow = new Date(`${date}T00:00:00`).getDay();
        return dow >= 1 && dow <= 5;
      }
    );
    const sickByDate = sickQuery.data ?? new Map<string, Set<string>>();

    // Approved vacation dates per employee
    const vacationByEmployee = new Map<string, Array<{ start: string; end: string }>>();
    (vacations || []).forEach((v: any) => {
      if (v.status !== 'approved') return;
      const list = vacationByEmployee.get(v.user_id) || [];
      list.push({ start: v.start_date, end: v.end_date });
      vacationByEmployee.set(v.user_id, list);
    });

    // Assignments per employee per day
    const byEmployeeDay = new Map<string, Map<string, Assignment[]>>();
    (weekAssignments || []).forEach((a) => {
      (a.employees || []).forEach((empId) => {
        if (!byEmployeeDay.has(empId)) byEmployeeDay.set(empId, new Map());
        const dayMap = byEmployeeDay.get(empId)!;
        const list = dayMap.get(a.date) || [];
        list.push(a);
        dayMap.set(a.date, list);
      });
    });

    // In the Fugt sub-department the lookup only ranks fugtteknikere
    const rankedEmployees = onlyFugtteknikere
      ? employees.filter(
          (emp) => emp.role === 'fugttekniker' || (emp.roles || []).includes('fugttekniker')
        )
      : employees;

    return rankedEmployees.map((emp) => {
      const homeDistanceKm =
        typeof emp.lat === 'number' && typeof emp.lng === 'number'
          ? haversineDistanceKm(target.lat, target.lng, emp.lat, emp.lng)
          : null;

      const dayMap = byEmployeeDay.get(emp.id) || new Map<string, Assignment[]>();
      const vacationRanges = vacationByEmployee.get(emp.id) || [];

      let bestAssignmentDistance: number | null = null;

      const days: ProximityDayInfo[] = weekDays.map((date) => {
        const dayAssignments = [...(dayMap.get(date) || [])].sort((a, b) =>
          (a.toTime || '').localeCompare(b.toTime || '')
        );
        const last = dayAssignments[dayAssignments.length - 1];

        let assignmentDistanceKm: number | null = null;
        dayAssignments.forEach((a) => {
          if (typeof a.lat === 'number' && typeof a.lng === 'number') {
            const d = haversineDistanceKm(target.lat, target.lng, a.lat, a.lng);
            if (assignmentDistanceKm === null || d < assignmentDistanceKm) assignmentDistanceKm = d;
            if (bestAssignmentDistance === null || d < bestAssignmentDistance) bestAssignmentDistance = d;
          }
        });

        const onVacation = vacationRanges.some((r) => date >= r.start && date <= r.end);
        const isSick = sickByDate.get(date)?.has(emp.id) ?? false;
        const inTraining = trainingIds.has(emp.id);
        const absent = onVacation || isSick || inTraining || !!emp.onLeave;

        // 8-hour working day starting at the first assignment (default 07:00)
        const firstStart = dayAssignments.length > 0
          ? [...dayAssignments].sort((a, b) => (a.fromTime || '').localeCompare(b.fromTime || ''))[0]?.fromTime
          : null;
        const dayStartMin = toMinutes(firstStart) ?? DEFAULT_DAY_START;
        const dayEndMin = dayStartMin + WORKDAY_MINUTES;
        const lastEndMin = toMinutes(last?.toTime);
        const freeMinutes = absent
          ? 0
          : lastEndMin === null
            ? WORKDAY_MINUTES
            : Math.max(0, dayEndMin - lastEndMin);

        return {
          date,
          absent,
          assignmentCount: dayAssignments.length,
          freeFrom: last?.toTime ? last.toTime.slice(0, 5) : null,
          dayEnd: toHHMM(dayEndMin),
          freeMinutes,
          hasEnoughFree: !absent && freeMinutes >= MIN_FREE_MINUTES,
          assignmentDistanceKm,
        };
      });

      let bestDistanceKm: number | null = null;
      let bestSource: 'home' | 'assignment' | null = null;
      if (homeDistanceKm !== null) {
        bestDistanceKm = homeDistanceKm;
        bestSource = 'home';
      }
      if (bestAssignmentDistance !== null && (bestDistanceKm === null || bestAssignmentDistance < bestDistanceKm)) {
        bestDistanceKm = bestAssignmentDistance;
        bestSource = 'assignment';
      }

      return {
        employee: emp,
        homeDistanceKm,
        homeTravelMin: homeDistanceKm !== null ? estimateTravelMinutes(homeDistanceKm) : null,
        bestDistanceKm,
        bestTravelMin: bestDistanceKm !== null ? estimateTravelMinutes(bestDistanceKm) : null,
        bestSource,
        days,
        hasAvailableDay: days.some((d) => !d.absent),
        hasEnoughFreeDay: days.some((d) => d.hasEnoughFree),
      };
    }).sort((a, b) => {
      // Enough free time first, then available, then shortest distance
      if (a.hasEnoughFreeDay !== b.hasEnoughFreeDay) return a.hasEnoughFreeDay ? -1 : 1;

      // Available first, then shortest distance, employees without coordinates last
      if (a.hasAvailableDay !== b.hasAvailableDay) return a.hasAvailableDay ? -1 : 1;
      if (a.bestDistanceKm === null && b.bestDistanceKm === null) return a.employee.name.localeCompare(b.employee.name);
      if (a.bestDistanceKm === null) return 1;
      if (b.bestDistanceKm === null) return -1;
      return a.bestDistanceKm - b.bestDistanceKm;
    });
  }, [active, onlyFugtteknikere, coordsQuery.data, employees, weekAssignments, weekDates, vacations, trainingIds, sickQuery.data]);

  return {
    results,
    isLoading: active && (coordsQuery.isLoading || sickQuery.isLoading),
    notFound: active && !coordsQuery.isLoading && !coordsQuery.data,
    isValidPostcode: isValidPostcode(postcode),
  };
};
