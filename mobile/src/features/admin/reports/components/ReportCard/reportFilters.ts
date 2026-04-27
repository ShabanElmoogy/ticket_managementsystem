/**
 * Generic row filter — returns rows where any of the extracted fields
 * contain the query string (case-insensitive).
 */
export function filterByQuery<T>(rows: T[], q: string, getFields: (r: T) => string[]): T[] {
  if (!Array.isArray(rows)) return [];
  if (!q.trim()) return rows;
  const lower = q.toLowerCase();
  return rows.filter((r) => r && getFields(r).some((v) => v.toLowerCase().includes(lower)));
}

export const customerFields = (r: { customerName?: string }) => [r.customerName ?? ''];
export const ticketFields   = (r: any) => [r.title ?? '', r.customer?.name ?? '', r.application?.name ?? ''];
