/**
 * Generic entity list PDF export.
 * Renders any array of objects as a table using their column definitions.
 */
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { ColDef } from '../components/AppDataTable';
import { esc }         from './htmlUtils';
import { buildPdfPage } from './pdfTemplate';

export async function exportEntityPdf<T extends { id: string }>(
  title: string,
  rows: T[],
  columns: ColDef<T>[],
): Promise<void> {
  // Skip action column
  const cols = columns.filter((c) => c.field !== '__actions__');

  const head = `<tr>${cols.map((c) => `<th>${esc(c.headerName)}</th>`).join('')}</tr>`;

  const body = rows.map((row) => {
    const cells = cols.map((col) => {
      const val = col.valueGetter
        ? col.valueGetter(row)
        : (row as any)[col.field as string];
      return `<td>${esc(val ?? '—')}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const tableHtml = `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
  const html = buildPdfPage(`${title} (${rows.length} records)`, tableHtml);

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export: ${title}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}
