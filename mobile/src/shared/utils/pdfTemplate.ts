/**
 * Generic PDF page template for expo-print.
 * Provides consistent styling across all PDF exports in the app.
 */

export const PDF_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, sans-serif; font-size: 13px; color: #1e293b; padding: 32px; }
  h1   { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .meta { font-size: 11px; color: #94a3b8; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th {
    background: #3b82f6; color: #fff; font-weight: 700;
    text-align: center; padding: 9px 10px;
    text-transform: uppercase; letter-spacing: 0.4px; font-size: 11px;
  }
  td { padding: 8px 10px; text-align: center; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) td { background: #f8fafc; }
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font-weight: 700; font-size: 11px;
  }
  .open        { background: #fef3c7; color: #b45309; }
  .in_progress { background: #ede9fe; color: #6d28d9; }
  .resolved    { background: #d1fae5; color: #065f46; }
  .closed      { background: #f1f5f9; color: #475569; }
  .low         { background: #d1fae5; color: #065f46; }
  .medium      { background: #fef3c7; color: #b45309; }
  .high        { background: #fee2e2; color: #b91c1c; }
  .urgent      { background: #fecaca; color: #991b1b; }
  .overdue     { background: #fee2e2; color: #b91c1c; }
  .ontime      { background: #d1fae5; color: #065f46; }
  .pct-open    { color: #b45309; font-weight: 700; }
  .pct-res     { color: #065f46; font-weight: 700; }
  .total       { font-weight: 800; font-size: 14px; }
  footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; }
`;

/**
 * Wraps a table HTML string in a full PDF page with header and footer.
 *
 * @param title   - Page heading (e.g. "Tickets Summary")
 * @param body    - Inner HTML content (table, etc.)
 * @param appName - Footer app name (default "TicketFlow")
 */
export function buildPdfPage(title: string, body: string, appName = 'TicketFlow'): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>${PDF_CSS}</style></head><body>
  <h1>📊 ${title}</h1>
  <p class="meta">Generated ${new Date().toLocaleString()}</p>
  ${body}
  <footer>${appName} Reports</footer>
  </body></html>`;
}
