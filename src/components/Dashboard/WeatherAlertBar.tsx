import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CloudRain, Wind, Users, Car as CarIcon } from 'lucide-react';
import { useAssignments } from '@/hooks/useAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useDepartment } from '@/context/DepartmentContext';
import { useWeatherAlertSettings, usePostalCodeCoordinates } from '@/hooks/useWeatherAlertSettings';

interface HourPoint { time: string; rain: number; gust: number }

const toMin = (t?: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};

const WeatherAlertBar: React.FC = () => {
  const { assignments } = useAssignments();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { selectedDepartmentId } = useDepartment();
  const { settings } = useWeatherAlertSettings(selectedDepartmentId);
  const { data: postalPoints } = usePostalCodeCoordinates(settings.postalCodes);

  // Area centre: configured postal codes, else tasks, else staff home coordinates
  const centre = useMemo(() => {
    const postal = (postalPoints ?? []).map(p => [p.lat, p.lng]);
    const pts = [
      ...(assignments ?? []).filter(a => a.lat && a.lng).map(a => [a.lat!, a.lng!]),
    ];
    const src = postal.length
      ? postal
      : pts.length
        ? pts
        : (employees ?? []).filter(e => e.lat && e.lng).map(e => [e.lat!, e.lng!]);
    if (!src.length) return null;
    const lat = src.reduce((s, p) => s + p[0], 0) / src.length;
    const lng = src.reduce((s, p) => s + p[1], 0) / src.length;
    return { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 };
  }, [assignments, employees, postalPoints]);

  const { data: hours } = useQuery({
    queryKey: ['weather-forecast', centre?.lat, centre?.lng],
    enabled: !!centre && settings.enabled,
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<HourPoint[]> => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${centre!.lat}&longitude=${centre!.lng}&hourly=precipitation,wind_gusts_10m&wind_speed_unit=ms&models=dmi_seamless&forecast_hours=24&timezone=Europe%2FCopenhagen`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const j = await res.json();
      return (j.hourly?.time ?? []).map((t: string, i: number) => ({
        time: t,
        rain: j.hourly.precipitation?.[i] ?? 0,
        gust: j.hourly.wind_gusts_10m?.[i] ?? 0,
      }));
    },
  });

  const alert = useMemo(() => {
    if (!settings.enabled) return null;
    if (!hours || hours.length < 6) return null;
    let best = { sum: 0, start: 0 };
    for (let i = 0; i + 6 <= hours.length; i++) {
      const sum = hours.slice(i, i + 6).reduce((s, h) => s + h.rain, 0);
      if (sum > best.sum) best = { sum, start: i };
    }
    const maxGust = hours.reduce((m, h) => (h.gust > m.gust ? h : m), hours[0]);
    const rain = best.sum >= RAIN_6H_MM;
    const wind = maxGust.gust >= GUST_MS;
    if (!rain && !wind) return null;
    const startTime = rain ? hours[best.start].time : maxGust.time;
    const endTime = rain ? hours[best.start + 5].time : maxGust.time;
    return { rain, wind, mm: Math.round(best.sum), gust: Math.round(maxGust.gust), startTime, endTime };
  }, [hours]);

  const reserve = useMemo(() => {
    if (!alert) return null;
    const start = new Date(alert.startTime);
    const day = format(start, 'yyyy-MM-dd');
    const fromMin = start.getHours() * 60 + start.getMinutes();
    const busyEmp = new Set<string>();
    const busyCar = new Set<string>();
    (assignments ?? []).filter(a => a.date === day && toMin(a.toTime) > fromMin).forEach(a => {
      a.assignedEmployees?.forEach(e => busyEmp.add(e.id));
      a.employees?.forEach(id => busyEmp.add(id));
      a.cars?.forEach(id => busyCar.add(id));
      if (typeof a.car === 'string') busyCar.add(a.car);
      else if (a.car?.id) busyCar.add(a.car.id);
    });
    const techs = (employees ?? []).filter(
      e => e.status === 'active' && (e.role === 'servicemedarbejder' || e.role === 'fugttekniker') && !busyEmp.has(e.id)
    ).length;
    const freeCars = (cars ?? []).filter(c => c.is_available && !busyCar.has(c.id)).length;
    return { techs, cars: freeCars, from: format(start, 'HH:mm') };
  }, [alert, assignments, employees, cars]);

  if (!alert || !reserve) return null;
  const Icon = alert.rain ? CloudRain : Wind;
  const dayLabel = format(new Date(alert.startTime), 'dd.MM');

  return (
    <div role="status" className="flex flex-col gap-2 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-warning-soft-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2 text-sm">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Beredskab: </span>
          {alert.rain && <>ca. {alert.mm} mm regn {dayLabel} kl. {format(new Date(alert.startTime), 'HH:mm')}–{format(new Date(alert.endTime), 'HH:mm')}</>}
          {alert.rain && alert.wind && ' · '}
          {alert.wind && <>vindstød op til {alert.gust} m/s</>}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs font-medium tabular-nums">
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{reserve.techs} teknikere</span>
        <span className="inline-flex items-center gap-1"><CarIcon className="h-3.5 w-3.5" />{reserve.cars} biler</span>
        <span className="opacity-80">ledige efter kl. {reserve.from}</span>
      </div>
    </div>
  );
};

export default React.memo(WeatherAlertBar);
