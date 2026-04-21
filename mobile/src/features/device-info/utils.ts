export function fmt(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? '✅ Yes' : '❌ No';
  return String(v) || '—';
}
