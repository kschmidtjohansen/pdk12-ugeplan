/** One shared listener that feeds cursor position to `.spotlight`/`.bento-card` elements. */
export function installSpotlight(): () => void {
  if (typeof window === 'undefined' || !window.matchMedia('(hover: hover)').matches) return () => {};
  let frame = 0;
  const onMove = (e: PointerEvent) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const el = (e.target as Element | null)?.closest?.('.spotlight, .bento-card') as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  return () => window.removeEventListener('pointermove', onMove);
}
