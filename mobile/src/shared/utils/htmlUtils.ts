/**
 * Utilities for building safe HTML strings.
 */

/** Escape a value for safe embedding in HTML content. */
export function esc(s: string | number | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Format an ISO date string as a locale date, or '—' if absent. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}
