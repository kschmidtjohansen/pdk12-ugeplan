import { useRef, useState, type TouchEvent } from 'react';

export const SWIPE_THRESHOLD = 96;

/** Afgør swipe-retning ud fra bevægelse; lodret scroll vinder altid. */
export function resolveSwipe(dx: number, dy: number, threshold = SWIPE_THRESHOLD): 'left' | 'right' | null {
  if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < threshold) return null;
  return dx > 0 ? 'right' : 'left';
}

interface Options { enabled: boolean; onRight?: () => void; onLeft?: () => void }

export function useSwipeAction({ enabled, onRight, onLeft }: Options) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const locked = useRef<'h' | 'v' | null>(null);
  const swiped = useRef(false);
  const [dx, setDx] = useState(0);

  const reset = () => { start.current = null; locked.current = null; setDx(0); };

  const handlers = enabled ? {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
      locked.current = null;
      swiped.current = false;
    },
    onTouchMove: (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.touches[0];
      const mx = t.clientX - start.current.x;
      const my = t.clientY - start.current.y;
      if (!locked.current && (Math.abs(mx) > 8 || Math.abs(my) > 8)) locked.current = Math.abs(mx) > Math.abs(my) ? 'h' : 'v';
      if (locked.current !== 'h') return;
      if ((mx > 0 && !onRight) || (mx < 0 && !onLeft)) return setDx(0);
      setDx(Math.max(-140, Math.min(140, mx)));
    },
    onTouchEnd: (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dir = locked.current === 'h' ? resolveSwipe(t.clientX - start.current.x, t.clientY - start.current.y) : null;
      if (dir) swiped.current = true;
      reset();
      if (dir === 'right') onRight?.();
      if (dir === 'left') onLeft?.();
    },
    onTouchCancel: reset,
  } : {};

  /** Bruges i onClick for at undgå at et swipe også åbner opgaven. */
  const consumeSwipe = () => { const s = swiped.current; swiped.current = false; return s; };

  return { dx, handlers, consumeSwipe };
}
