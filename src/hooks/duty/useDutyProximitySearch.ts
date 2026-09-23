import { useQuery } from '@tanstack/react-query';
import { fetchAddressCoords, fetchPostnrCoords } from '@/hooks/useDawaPostnrLookup';
import { haversineDistanceKm } from '@/utils/haversine';
import { estimateTravelMinutes } from '@/utils/travelTime';
import type { Employee } from '@/types/employee';

export interface DutyProximityResult {
  employee: Employee;
  distanceKm: number | null;
  travelMin: number | null;
}

interface Params {
  postcode: string;
  employees: Employee[];
  enabled?: boolean;
}

export const isValidDutyPostcode = (p: string) => /^\d{4}$/.test((p || '').trim());

/**
 * Ranks duty personnel by how far their home address is from the damage
 * postcode. Read-only lookup — nothing is written back.
 */
export const useDutyProximitySearch = ({ postcode, employees, enabled = true }: Params) => {
  const trimmed = (postcode || '').trim();
  const valid = isValidDutyPostcode(trimmed);

  const employeeKey = employees
    .map((e) => `${e.id}:${e.lat ?? ''}:${e.lng ?? ''}:${e.home_postcode ?? ''}`)
    .join('|');

  const query = useQuery({
    queryKey: ['duty_proximity', trimmed, employeeKey] as const,
    queryFn: async (): Promise<{ results: DutyProximityResult[]; notFound: boolean }> => {
      const target = await fetchPostnrCoords(trimmed);
      if (!target) return { results: [], notFound: true };

      // Resolve missing coordinates from the stored home address/postcode.
      const resolved = new Map<string, { lat: number; lng: number } | null>();
      await Promise.all(
        employees.map(async (emp) => {
          if (typeof emp.lat === 'number' && typeof emp.lng === 'number') {
            resolved.set(emp.id, { lat: emp.lat, lng: emp.lng });
            return;
          }
          if (emp.home_address && emp.home_address.trim().length > 3) {
            resolved.set(emp.id, await fetchAddressCoords(emp.home_address));
            return;
          }
          if (emp.home_postcode && /^\d{4}$/.test(emp.home_postcode.trim())) {
            resolved.set(emp.id, await fetchPostnrCoords(emp.home_postcode.trim()));
            return;
          }
          resolved.set(emp.id, null);
        })
      );

      const results: DutyProximityResult[] = employees.map((employee) => {
        const point = resolved.get(employee.id) ?? null;
        if (!point) return { employee, distanceKm: null, travelMin: null };
        const distanceKm = haversineDistanceKm(target.lat, target.lng, point.lat, point.lng);
        return {
          employee,
          distanceKm,
          travelMin: estimateTravelMinutes(distanceKm),
        };
      });

      results.sort((a, b) => {
        const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
        if (da !== db) return da - db;
        return a.employee.name.localeCompare(b.employee.name, 'da-DK');
      });

      return { results, notFound: false };
    },
    enabled: enabled && valid && employees.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  return {
    results: query.data?.results ?? [],
    notFound: query.data?.notFound ?? false,
    isLoading: query.isFetching,
    isValidPostcode: valid,
  };
};
