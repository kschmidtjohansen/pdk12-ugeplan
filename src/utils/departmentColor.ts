// Deterministic colour mapping for departments.
// Hash department UUID to one of 6 Tailwind palettes.
// Class names are written as full literal strings so Tailwind JIT picks them up.

const PALETTES = [
  { pill: 'bg-blue-100 text-blue-800 hover:bg-blue-200', dot: 'bg-blue-500' },
  { pill: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200', dot: 'bg-emerald-500' },
  { pill: 'bg-amber-100 text-amber-800 hover:bg-amber-200', dot: 'bg-amber-500' },
  { pill: 'bg-rose-100 text-rose-800 hover:bg-rose-200', dot: 'bg-rose-500' },
  { pill: 'bg-violet-100 text-violet-800 hover:bg-violet-200', dot: 'bg-violet-500' },
  { pill: 'bg-sky-100 text-sky-800 hover:bg-sky-200', dot: 'bg-sky-500' },
] as const;

export function getDepartmentColorClasses(id: string | null | undefined) {
  if (!id) return PALETTES[0];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) >>> 0;
  return PALETTES[sum % PALETTES.length];
}
