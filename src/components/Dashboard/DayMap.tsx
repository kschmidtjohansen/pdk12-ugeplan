import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPinOff } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';

export interface DayMapItem {
  assignment: Assignment;
  /** Number shown on the pin, shared with the timeline. */
  n: number;
}

interface DayMapProps {
  items: DayMapItem[];
  nowMin: number;
  onOpen: (a: Assignment) => void;
  className?: string;
}

const toMin = (t?: string) => {
  if (!t) return 0;
  const [h, m] = t.split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};

const hasCoords = (a: Assignment) =>
  typeof a.lat === 'number' && typeof a.lng === 'number' && Number.isFinite(a.lat) && Number.isFinite(a.lng) && !(a.lat === 0 && a.lng === 0);

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** A route links the tasks of one car (or one team when no car) in time order. */
const routeKey = (a: Assignment) => {
  const cars = a.cars?.length ? a.cars : typeof a.car === 'string' ? [a.car] : a.car?.id ? [a.car.id] : [];
  if (cars.length) return `car:${[...cars].sort().join(',')}`;
  const team = (a.assignedEmployees ?? []).map(e => e.id).sort().join(',');
  return team ? `team:${team}` : null;
};

/**
 * Dagskortet: today's tasks as numbered pins on an OpenStreetMap base map.
 * The numbers match the timeline. Tasks without coordinates are counted below the map.
 */
const DayMap: React.FC<DayMapProps> = ({ items, nowMin, onOpen, className }) => {
  const { t } = useTranslation();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;

  const placed = useMemo(() => items.filter(i => hasCoords(i.assignment)), [items]);
  const missing = items.length - placed.length;

  // Create the map once.
  useEffect(() => {
    if (!el.current || map.current) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const m = L.map(el.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      zoomAnimation: !reduce,
      fadeAnimation: !reduce,
      markerZoomAnimation: !reduce,
    });
    L.control.zoom({ position: 'bottomright', zoomInTitle: 'Zoom ind', zoomOutTitle: 'Zoom ud' }).addTo(m);
    m.attributionControl.setPrefix(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(m);
    m.setView([55.5, 9.7], 8);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; layer.current = null; };
  }, []);

  // Draw pins and routes whenever the day changes.
  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    if (placed.length === 0) return;

    // Routes first so the pins sit on top.
    const routes = new Map<string, DayMapItem[]>();
    placed.forEach(i => {
      const k = routeKey(i.assignment);
      if (!k) return;
      routes.set(k, [...(routes.get(k) ?? []), i]);
    });
    routes.forEach(list => {
      if (list.length < 2) return;
      const pts = [...list].sort((a, b) => toMin(a.assignment.fromTime) - toMin(b.assignment.fromTime)).map(i => L.latLng(i.assignment.lat as number, i.assignment.lng as number));
      L.polyline(pts, { className: 'facet-map-route', weight: 3, interactive: false }).addTo(g);
    });

    // One pin per address; several tasks at the same address share it.
    const byPlace = new Map<string, DayMapItem[]>();
    placed.forEach(i => {
      const k = `${(i.assignment.lat as number).toFixed(5)},${(i.assignment.lng as number).toFixed(5)}`;
      byPlace.set(k, [...(byPlace.get(k) ?? []), i]);
    });
    byPlace.forEach(list => {
      const first = list[0];
      const a = first.assignment;
      const current = list.some(i => nowMin >= toMin(i.assignment.fromTime) && nowMin <= toMin(i.assignment.toTime));
      const past = list.every(i => toMin(i.assignment.toTime) < nowMin);
      const label = list.length === 1 ? String(first.n) : `${first.n}+`;
      const title = list.map(i => `${i.n}. ${i.assignment.fromTime?.slice(0, 5) ?? ''} ${i.assignment.title ?? ''}`.trim()).join('\n');
      const icon = L.divIcon({
        className: 'facet-map-pin-wrap',
        html: `<span class="facet-map-pin${current ? ' is-now' : ''}${past ? ' is-past' : ''}">${escapeHtml(label)}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const marker = L.marker([a.lat as number, a.lng as number], {
        icon,
        keyboard: true,
        title: t('ui.dayMapOpen', { n: first.n, title: a.title ?? '' }),
        alt: title,
        riseOnHover: true,
        zIndexOffset: current ? 1000 : 0,
      });
      marker.bindTooltip(escapeHtml(title).replace(/\n/g, '<br>'), { direction: 'top', offset: [0, -16], className: 'facet-map-tip' });
      marker.on('click', () => openRef.current(a));
      marker.addTo(g);
    });

    const bounds = L.latLngBounds(placed.map(i => [i.assignment.lat as number, i.assignment.lng as number] as [number, number]));
    m.fitBounds(bounds, { padding: [48, 48], maxZoom: 13, animate: false });
  }, [placed, nowMin, t]);

  return (
    <section aria-labelledby="dagskort-title" className={cn('facet-card relative isolate flex min-h-72 flex-col overflow-hidden', className)}>
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex items-center gap-2">
        <h2 id="dagskort-title" className="facet-map-label font-display text-sm font-semibold text-foreground">{t('ui.dayMap')}</h2>
        {placed.length > 0 && (
          <span className="facet-map-label ml-auto text-xs font-medium text-muted-foreground">
            {t('ui.dayMapOnMap', { count: placed.length })}
            {missing > 0 && <> · {t('ui.dayMapMissing', { count: missing })}</>}
          </span>
        )}
      </div>
      <div ref={el} role="region" aria-label={t('ui.dayMapLabel')} className="facet-map relative z-0 min-h-72 flex-1" />
      {placed.length === 0 && (
        <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center gap-2 bg-background/70 px-6 text-center backdrop-blur-[2px]">
          <MapPinOff className="h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{items.length === 0 ? t('ui.noCasesToday') : t('ui.dayMapEmpty')}</p>
        </div>
      )}
    </section>
  );
};

export default DayMap;
