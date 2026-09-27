import React from 'react';
import { cn } from '@/lib/utils';

interface AssignmentTimeStripProps {
  fromTime?: string;
  toTime?: string;
  /** Start of the visible day window (hours). */
  dayStart?: number;
  /** End of the visible day window (hours). */
  dayEnd?: number;
  className?: string;
}

const toMinutes = (value?: string): number | null => {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

/**
 * Slim horizontal day strip (default 07:00–17:00) that colours the booked
 * time span, so a planner can spot gaps without reading the clock values.
 */
const AssignmentTimeStrip: React.FC<AssignmentTimeStripProps> = ({
  fromTime,
  toTime,
  dayStart = 7,
  dayEnd = 17,
  className,
}) => {
  const windowStart = dayStart * 60;
  const windowEnd = dayEnd * 60;
  const windowSpan = windowEnd - windowStart;

  const rawFrom = toMinutes(fromTime);
  const rawTo = toMinutes(toTime);
  if (rawFrom === null || rawTo === null || windowSpan <= 0) return null;

  const from = Math.max(windowStart, Math.min(rawFrom, windowEnd));
  const to = Math.max(from, Math.min(Math.max(rawTo, rawFrom), windowEnd));

  const leftPct = ((from - windowStart) / windowSpan) * 100;
  const widthPct = Math.max(((to - from) / windowSpan) * 100, 2.5);

  const outsideBefore = rawFrom < windowStart;
  const outsideAfter = rawTo > windowEnd;

  const hourMarks: number[] = [];
  for (let h = dayStart + 1; h < dayEnd; h += 1) hourMarks.push(h);

  return (
    <div
      className={cn('relative h-1.5 w-full rounded-full bg-muted overflow-hidden', className)}
      role="img"
      aria-label={`Tidsrum ${fromTime}–${toTime}`}
      title={`${fromTime}–${toTime}`}
    >
      {hourMarks.map((h) => (
        <span
          key={h}
          className="absolute top-0 h-full w-px bg-border/70"
          style={{ left: `${((h * 60 - windowStart) / windowSpan) * 100}%` }}
        />
      ))}
      <span
        className={cn(
          'absolute top-0 h-full bg-primary/70',
          outsideBefore ? 'rounded-l-none' : 'rounded-l-full',
          outsideAfter ? 'rounded-r-none' : 'rounded-r-full'
        )}
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      />
    </div>
  );
};

export default React.memo(AssignmentTimeStrip);
