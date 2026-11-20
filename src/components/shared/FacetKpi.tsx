import React from 'react';
import { cn } from '@/lib/utils';

interface FacetKpiProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  /** When set, the card is a button (e.g. a filter shortcut). */
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

/** Lærredets nøgletalskort: lille etiket, stort tal i display-skrift, en linje under. */
const FacetKpi: React.FC<FacetKpiProps> = ({ label, value, sub, onClick, active, className }) => {
  const body = (
    <>
      <span className="block text-[13px] text-muted-foreground">{label}</span>
      <span className="block font-display text-[2rem] font-bold leading-none tracking-tight text-foreground">{value}</span>
      {sub && <span className="mt-1 block text-xs text-muted-foreground">{sub}</span>}
    </>
  );
  const cls = cn('facet-card flex flex-col gap-1 px-4 py-4 text-left sm:px-5', onClick && 'facet-lift', active && 'ring-2 ring-primary/50', className);
  return onClick
    ? <button type="button" onClick={onClick} aria-pressed={active} className={cls}>{body}</button>
    : <div className={cls}>{body}</div>;
};

export default FacetKpi;
