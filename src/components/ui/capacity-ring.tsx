import { cn } from '@/lib/utils';

/** Lille ring der viser hvor meget af en 8-timers dag der er booket. */
export function CapacityRing({ minutes, className }: { minutes: number; className?: string }) {
  const ratio = Math.min(minutes / 480, 1);
  const r = 8;
  const c = 2 * Math.PI * r;
  const tone = ratio >= 1 ? 'text-destructive' : ratio >= 0.5 ? 'text-warning' : 'text-success';
  const hours = (minutes / 60).toFixed(1).replace('.', ',');
  return (
    <svg viewBox="0 0 20 20" className={cn('h-5 w-5 shrink-0 -rotate-90', className)} role="img" aria-label={`${hours} t booket`}>
      <title>{`${hours} t af 8 t booket`}</title>
      <circle cx="10" cy="10" r={r} fill="none" strokeWidth="3" className="stroke-muted" />
      <circle
        cx="10" cy="10" r={r} fill="none" strokeWidth="3" strokeLinecap="round"
        className={cn('stroke-current transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none', tone)}
        strokeDasharray={c} strokeDashoffset={c * (1 - ratio)}
      />
    </svg>
  );
}
