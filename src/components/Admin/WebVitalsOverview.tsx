import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Gauge, MousePointerClick, MoveVertical, Timer, Zap } from 'lucide-react';

type Row = {
  id: string;
  created_at: string;
  metric_name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB';
  metric_value: number;
  rating: 'good' | 'needs-improvement' | 'poor' | null;
  route: string;
};

const METRICS = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const;
const PERIODS = [
  { value: '1', label: 'Sidste 24 timer' },
  { value: '7', label: 'Sidste 7 dage' },
  { value: '30', label: 'Sidste 30 dage' },
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LCP: Gauge,
  INP: MousePointerClick,
  CLS: MoveVertical,
  FCP: Timer,
  TTFB: Zap,
};

const formatValue = (name: string, v: number) =>
  name === 'CLS' ? v.toFixed(3) : `${Math.round(v)} ms`;

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
};

const ratingColor = (r: string | null) =>
  r === 'good'
    ? 'text-emerald-600'
    : r === 'needs-improvement'
      ? 'text-amber-600'
      : r === 'poor'
        ? 'text-destructive'
        : 'text-muted-foreground';

const WebVitalsOverview: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');
  const [route, setRoute] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const since = new Date(Date.now() - parseInt(period, 10) * 86400_000).toISOString();
      const { data, error } = await supabase
        .from('web_vitals_metrics')
        .select('id, created_at, metric_name, metric_value, rating, route')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000);
      if (cancelled) return;
      if (error) {
        if (import.meta.env.DEV) console.error('[WebVitals] load failed', error.message);
        setRows([]);
      } else {
        setRows((data || []) as Row[]);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const routes = useMemo(() => {
    const set = new Set(rows.map((r) => r.route));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(
    () => (route === 'all' ? rows : rows.filter((r) => r.route === route)),
    [rows, route]
  );

  const stats = useMemo(() => {
    return METRICS.map((name) => {
      const samples = filtered.filter((r) => r.metric_name === name);
      const values = samples.map((s) => s.metric_value).sort((a, b) => a - b);
      const p75 = percentile(values, 75);
      const median = percentile(values, 50);
      const good = samples.filter((s) => s.rating === 'good').length;
      const ni = samples.filter((s) => s.rating === 'needs-improvement').length;
      const poor = samples.filter((s) => s.rating === 'poor').length;
      const total = samples.length;
      return { name, p75, median, total, good, ni, poor };
    });
  }, [filtered]);

  const slowestPerRoute = useMemo(() => {
    const byKey = new Map<string, { route: string; metric: string; values: number[] }>();
    for (const r of filtered) {
      const k = `${r.route}|${r.metric_name}`;
      let bucket = byKey.get(k);
      if (!bucket) {
        bucket = { route: r.route, metric: r.metric_name, values: [] };
        byKey.set(k, bucket);
      }
      bucket.values.push(r.metric_value);
    }
    return Array.from(byKey.values())
      .map((b) => ({
        route: b.route,
        metric: b.metric,
        p75: percentile(b.values.sort((a, b) => a - b), 75),
        samples: b.values.length,
      }))
      .filter((b) => b.metric !== 'CLS') // CLS is unitless and ranks differently
      .sort((a, b) => b.p75 - a.p75)
      .slice(0, 10);
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Periode</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Side</span>
          <Select value={route} onValueChange={setRoute}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle sider</SelectItem>
              {routes.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s) => {
          const Icon = ICONS[s.name];
          const goodPct = s.total > 0 ? Math.round((s.good / s.total) * 100) : 0;
          return (
            <Card key={s.name} className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {s.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-semibold">
                  {s.total > 0 ? formatValue(s.name, s.p75) : '—'}
                </div>
                <div className="text-xs text-muted-foreground">p75</div>
                <div className="text-xs">
                  <span className="text-emerald-600">{s.good}</span>{' / '}
                  <span className="text-amber-600">{s.ni}</span>{' / '}
                  <span className="text-destructive">{s.poor}</span>
                  <span className="text-muted-foreground"> ({s.total} prøver, {goodPct}% good)</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Top 10 langsomste (p75 pr. side)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Indlæser…</p>
          ) : slowestPerRoute.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen målinger endnu.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Side</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">p75</TableHead>
                  <TableHead className="text-right">Prøver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slowestPerRoute.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.route}</TableCell>
                    <TableCell>{r.metric}</TableCell>
                    <TableCell className={`text-right ${ratingColor(null)}`}>
                      {formatValue(r.metric, r.p75)}
                    </TableCell>
                    <TableCell className="text-right">{r.samples}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebVitalsOverview;
