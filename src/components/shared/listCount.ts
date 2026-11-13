/** Header count for list pages: "12 i alt" unfiltered, "3 af 12" when a filter or search is active. */
export function formatListCount(count: number, total: number, filtered: boolean, da: boolean): string {
  if (!filtered) return da ? `${total} i alt` : `${total} total`;
  return da ? `${count} af ${total}` : `${count} of ${total}`;
}
