/** Sort cars by their car number in natural numeric order (8, 10, 11), falling back to name. */
export function sortCarsByNumber<T extends { car_number?: string | null; name?: string | null }>(cars: T[]): T[] {
  return [...cars].sort((a, b) => {
    const an = (a.car_number || '').trim();
    const bn = (b.car_number || '').trim();
    if (an && !bn) return -1;
    if (!an && bn) return 1;
    const cmp = an.localeCompare(bn, 'da', { numeric: true, sensitivity: 'base' });
    if (cmp !== 0) return cmp;
    return (a.name || '').localeCompare(b.name || '', 'da', { numeric: true });
  });
}
