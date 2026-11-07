import { cn } from '@/lib/utils';

interface AvatarStackProps {
  people: Array<{ id: string; name: string }>;
  max?: number;
  className?: string;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');

/** Cult UI-inspireret avatar-stak: overlapper i hvile, spreder sig ved hover/fokus. */
export function AvatarStack({ people, max = 4, className }: AvatarStackProps) {
  if (people.length === 0) return null;
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div
      className={cn('group/stack flex items-center', className)}
      aria-label={people.map(p => p.name).join(', ')}
      title={people.map(p => p.name).join(', ')}
    >
      {shown.map((p, i) => (
        <span
          key={p.id}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-[10px] font-semibold text-primary transition-[margin] duration-200 motion-reduce:transition-none',
            i > 0 && '-ml-2 group-hover/stack:ml-0.5 group-focus-within/stack:ml-0.5',
          )}
        >
          {initials(p.name)}
        </span>
      ))}
      {rest > 0 && (
        <span className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground transition-[margin] duration-200 group-hover/stack:ml-0.5">
          +{rest}
        </span>
      )}
    </div>
  );
}
