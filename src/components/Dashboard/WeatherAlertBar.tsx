import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CloudRain, Wind, Users, Car as CarIcon, ExternalLink } from 'lucide-react';
import { useAssignments } from '@/hooks/useAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useDepartment } from '@/context/DepartmentContext';
import { useWeatherAlertSettings, usePostalCodeCoordinates } from '@/hooks/useWeatherAlertSettings';

interface HourPoint { time: string; rain: number; gust: number }
interface QuarterPoint { time: string; rain: number }

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

  const { data: forecast } = useQuery({
    queryKey: ['weather-forecast', centre?.lat, centre?.lng],
    enabled: !!centre && settings.enabled,
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<{ hours: HourPoint[]; quarters: QuarterPoint[] }> => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${centre!.lat}&longitude=${centre!.lng}&hourly=precipitation,wind_gusts_10m&minutely_15=precipitation&wind_speed_unit=ms&models=dmi_seamless&forecast_hours=48&timezone=Europe%2FCopenhagen`;
      const res = await fetch(url);
      if (!res.ok) return { hours: [], quarters: [] };
      const j = await res.json();
      const hours = (j.hourly?.time ?? []).map((t: string, i: number) => ({
        time: t,
        rain: j.hourly.precipitation?.[i] ?? 0,
        gust: j.hourly.wind_gusts_10m?.[i] ?? 0,
      }));
      const quarters = (j.minutely_15?.time ?? []).map((t: string, i: number) => ({
        time: t,
        rain: j.minutely_15.precipitation?.[i] ?? 0,
      }));
      return { hours, quarters };
    },
  });
  const hours = forecast?.hours;

  const alert = useMemo(() => {
    if (!settings.enabled) return null;
    if (!hours || hours.length < 24) return null;
    // Insurance thresholds: rolling 24h rain sum, 30-min intensity, max wind gust
    let best24 = { sum: 0, start: 0 };
    for (let i = 0; i + 24 <= hours.length; i++) {
      const sum = hours.slice(i, i + 24).reduce((s, h) => s + h.rain, 0);
      if (sum > best24.sum) best24 = { sum, start: i };
    }
    const quarters = forecast?.quarters ?? [];
    let best30 = { sum: 0, start: 0 };
    for (let i = 0; i + 2 <= quarters.length; i++) {
      const sum = quarters[i].rain + quarters[i + 1].rain;
      if (sum > best30.sum) best30 = { sum, start: i };
    }
    const maxGust = hours.reduce((m, h) => (h.gust > m.gust ? h : m), hours[0]);
    const rain24 = best24.sum >= settings.rain24hMm;
    const rain30 = best30.sum >= settings.rain30minMm;
    const wind = maxGust.gust >= settings.gustMs;
    if (!rain24 && !rain30 && !wind) return null;
    const rain = rain24 || rain30;
    const startTime = rain24
      ? hours[best24.start].time
      : rain30
        ? quarters[best30.start]?.time ?? maxGust.time
        : maxGust.time;
    const endTime = rain24
      ? hours[Math.min(best24.start + 23, hours.length - 1)].time
      : rain30
        ? quarters[Math.min(best30.start + 1, quarters.length - 1)]?.time ?? maxGust.time
        : maxGust.time;
    return {
      rain24, rain30, wind, rain,
      mm24: Math.round(best24.sum),
      mm30: Math.round(best30.sum * 10) / 10,
      gust: Math.round(maxGust.gust),
      startTime, endTime,
    };
  }, [hours, forecast?.quarters, settings.enabled, settings.rain24hMm, settings.rain30minMm, settings.gustMs]);

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
          {alert.rain24 && <>ca. {alert.mm24} mm regn på 24 timer {dayLabel} — over grænsen for skybrudsdækning ({settings.rain24hMm} mm/24t)</>}
          {alert.rain24 && (alert.rain30 || alert.wind) && ' · '}
          {alert.rain30 && <>kraftig regn ({alert.mm30} mm/30 min) kl. {format(new Date(alert.startTime), 'HH:mm')}</>}
          {alert.rain30 && alert.wind && ' · '}
          {alert.wind && <>vindstød op til {alert.gust} m/s — stormdækning fra 17,2 m/s</>}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs font-medium tabular-nums">
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{reserve.techs} teknikere</span>
        <span className="inline-flex items-center gap-1"><CarIcon className="h-3.5 w-3.5" />{reserve.cars} biler</span>
        <span className="opacity-80">ledige efter kl. {reserve.from}</span>
        <a
          href="https://forsikringsvejret.dk/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 underline underline-offset-2 hover:no-underline sm:min-h-0"
        >
          Tjek på Forsikringsvejret
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default React.memo(WeatherAlertBar);
