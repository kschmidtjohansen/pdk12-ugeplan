import React from 'react';
import { Quote, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyQuoteCardProps {
  quote: string;
  /** Compact variant used inside the command bar */
  compact?: boolean;
  className?: string;
}

/**
 * Dagens citat — fremhævet, motiverende kort.
 * Bruger udelukkende semantiske design tokens.
 */
const DailyQuoteCard: React.FC<DailyQuoteCardProps> = ({ quote, compact = false, className }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5',
      'flex items-start gap-3 animate-fade-in',
      compact ? 'px-3 py-2' : 'px-4 py-3',
      className
    )}
  >
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary/70"
    />
    <span
      className={cn(
        'mt-0.5 flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
        compact ? 'ml-1 h-7 w-7' : 'ml-1 h-9 w-9'
      )}
      aria-hidden
    >
      <Quote className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </span>
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="h-3 w-3" aria-hidden />
        Dagens citat
      </p>
      <p
        className={cn(
          'text-foreground',
          compact ? 'text-sm font-medium leading-snug' : 'text-base font-medium leading-relaxed md:text-lg'
        )}
      >
        {quote}
      </p>
    </div>
  </div>
);

export default DailyQuoteCard;
