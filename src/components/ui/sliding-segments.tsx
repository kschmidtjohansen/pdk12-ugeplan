import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SlidingSegment<T extends string> { key: T; label: ReactNode; dot?: string | null }

interface Props<T extends string> {
  segments: SlidingSegment<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
}

/** Segmentvælger med en flydende markør, der glider til det valgte punkt. */
export function SlidingSegments<T extends string>({ segments, value, onChange, ariaLabel, className }: Props<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = refs.current[value];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, segments]);
  return (
    <div role="group" aria-label={ariaLabel} className={cn('relative inline-flex items-center rounded-lg bg-muted/60 p-1', className)}>
      {pill && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-md bg-primary shadow-sm transition-all duration-200 ease-out motion-reduce:transition-none"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {segments.map(seg => {
        const active = seg.key === value;
        return (
          <button
            key={seg.key}
            ref={el => { refs.current[seg.key] = el; }}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(seg.key)}
            className={cn(
              'relative z-10 flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {seg.dot && <span aria-hidden className={cn('h-2 w-2 rounded-full', seg.dot)} />}
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
