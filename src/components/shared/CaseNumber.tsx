import React from 'react';
import { Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Øverste niveau i sagshierarkiet: lille, dæmpet sagsnummer med fast tegnbredde. */
const CaseNumber: React.FC<{ value?: string | null; className?: string }> = ({ value, className }) => {
  if (!value) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground tabular-nums', className)}>
      <Hash className="h-3 w-3 shrink-0" aria-hidden />
      {value}
    </span>
  );
};

export default CaseNumber;
