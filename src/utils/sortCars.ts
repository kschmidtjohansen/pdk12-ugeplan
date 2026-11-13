/** Treat a BIL prefix as a label, so BIL25 sits between 24 and 26. */
function carNumberKey(value?: string | null): string {
  return (value || '').trim().replace(/^bil[\s-]*(?=\d)/i, '');
}

/** Sort cars by their car number in natural numeric order, falling back to name. */
export function sortCarsByNumber<T extends { car_number?: string | null; name?: string | null }>(cars: T[]): T[] {
  return [...cars].sort((a, b) => {
    const an = carNumberKey(a.car_number);
    const bn = carNumberKey(b.car_number);
    if (an && !bn) return -1;
    if (!an && bn) return 1;
    const cmp = an.localeCompare(bn, 'da', { numeric: true, sensitivity: 'base' });
    if (cmp !== 0) return cmp;
    return (a.name || '').localeCompare(b.name || '', 'da', { numeric: true });
  });
}
