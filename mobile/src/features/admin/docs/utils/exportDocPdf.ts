import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Doc, DocBlock, CalloutType } from '../types/types';

// ── Color maps ────────────────────────────────────────────────────────────────

const CALLOUT_COLORS: Record<CalloutType, { bg: string; border: string; emoji: string }> = {
  info:    { bg: '#eff6ff', border: '#3b82f6', emoji: 'ℹ️' },
  warning: { bg: '#fffbeb', border: '#f59e0b', emoji: '⚠️' },
  success: { bg: '#f0fdf4', border: '#10b981', emoji: '✅' },
  error:   { bg: '#fef2f2', border: '#ef4444', emoji: '❌' },
};

// ── Block → HTML ──────────────────────────────────────────────────────────────

function blockToHtml(block: DocBlock): string {
  const align = block.settings?.align ?? 'left';
  const color = block.settings?.color ?? '#1e293b';

  switch (block.type) {
    case 'heading':
      return `<h2 style="text-align:${align};color:${color};margin:16px 0 8px;font-size:22px;font-weight:700;">${escHtml(block.text)}</h2>`;

    case 'text':
      // html field already contains rich HTML from the editor
      return `<div style="text-align:${align};color:${color};font-size:14px;line-height:1.6;margin-bottom:12px;">${block.html}</div>`;

    case 'divider': {
      const h   = block.settings?.dividerThickness ?? 1;
      const c   = block.settings?.dividerColor ?? '#e2e8f0';
      return `<hr style="border:none;border-top:${h}px solid ${c};margin:16px 0;" />`;
    }

    case 'image':
      return block.url
        ? `<figure style="margin:12px 0;text-align:center;">
             <img src="${escHtml(block.url)}" style="max-width:100%;border-radius:8px;" />
             ${block.caption ? `<figcaption style="font-size:12px;color:#64748b;margin-top:4px;">${escHtml(block.caption)}</figcaption>` : ''}
           </figure>`
        : '';

    case 'video':
      return `<div style="background:#f1f5f9;border-radius:8px;padding:16px;text-align:center;margin:12px 0;">
                <p style="font-size:13px;color:#64748b;">🎬 Video: <a href="${escHtml(block.url)}">${escHtml(block.url)}</a></p>
                ${block.caption ? `<p style="font-size:12px;color:#94a3b8;">${escHtml(block.caption)}</p>` : ''}
              </div>`;

    case 'bulletedList':
      return `${block.title ? `<p style="font-weight:700;margin-bottom:4px;">${escHtml(block.title)}</p>` : ''}
              <ul style="margin:0 0 12px;padding-left:20px;">
                ${block.items.map(i => `<li style="font-size:14px;line-height:1.6;">${escHtml(i)}</li>`).join('')}
              </ul>`;

    case 'numberedList':
      return `${block.title ? `<p style="font-weight:700;margin-bottom:4px;">${escHtml(block.title)}</p>` : ''}
              <ol style="margin:0 0 12px;padding-left:20px;">
                ${block.items.map(i => `<li style="font-size:14px;line-height:1.6;">${escHtml(i)}</li>`).join('')}
              </ol>`;

    case 'code':
      return `<pre style="background:#0f172a;color:#e2e8f0;padding:14px;border-radius:8px;font-size:12px;overflow-x:auto;margin:12px 0;"><code>${escHtml(block.code)}</code></pre>`;

    case 'quote':
      return `<blockquote style="border-left:4px solid #8b5cf6;padding:10px 16px;margin:12px 0;background:#f5f3ff;border-radius:0 8px 8px 0;">
                <p style="font-style:italic;font-size:15px;color:#4c1d95;margin:0;">${escHtml(block.text)}</p>
                ${block.attribution ? `<footer style="font-size:12px;color:#7c3aed;margin-top:6px;">— ${escHtml(block.attribution)}</footer>` : ''}
              </blockquote>`;

    case 'callout': {
      const cfg = CALLOUT_COLORS[block.calloutType];
      return `<div style="background:${cfg.bg};border-left:4px solid ${cfg.border};border-radius:8px;padding:12px 16px;margin:12px 0;display:flex;gap:10px;">
                <span style="font-size:18px;">${cfg.emoji}</span>
                <p style="font-size:14px;line-height:1.6;margin:0;color:#1e293b;">${escHtml(block.text)}</p>
              </div>`;
    }

    case 'table':
      return `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
                <thead>
                  <tr>${block.headers.map(h => `<th style="background:#f8fafc;border:1px solid #e2e8f0;padding:8px 10px;text-align:left;font-weight:700;">${escHtml(h)}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${block.rows.map((row, ri) =>
                    `<tr style="background:${ri % 2 === 0 ? '#fff' : '#f8fafc'};">
                      ${row.map(cell => `<td style="border:1px solid #e2e8f0;padding:8px 10px;">${escHtml(cell)}</td>`).join('')}
                    </tr>`
                  ).join('')}
                </tbody>
              </table>`;

    case 'toggle':
      return `<details style="margin:8px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <summary style="padding:10px 14px;background:#f8fafc;font-weight:600;cursor:pointer;">${escHtml(block.summary)}</summary>
                <div style="padding:12px 14px;font-size:14px;line-height:1.6;">${escHtml(block.content)}</div>
              </details>`;

    case 'tabs':
      return block.tabs.map((tab, i) =>
        `<div style="margin-bottom:8px;">
           <p style="font-weight:700;font-size:13px;color:#3b82f6;margin:0 0 4px;">${escHtml(tab.label)}</p>
           <div style="padding:10px;background:#f8fafc;border-radius:8px;font-size:14px;line-height:1.6;">${escHtml(tab.content)}</div>
         </div>`
      ).join('');

    case 'videoCarousel':
      return `<div style="margin:12px 0;">
                ${block.videos.map((v, i) =>
                  `<div style="padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:6px;">
                     <span style="font-size:12px;color:#64748b;">${i + 1}. </span>
                     <strong>${escHtml(v.title)}</strong>
                     <a href="${escHtml(v.url)}" style="font-size:12px;color:#3b82f6;margin-left:8px;">${escHtml(v.url)}</a>
                   </div>`
                ).join('')}
              </div>`;

    default:
      return '';
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Doc → full HTML page ──────────────────────────────────────────────────────

function docToHtml(doc: Doc): string {
  const blocksHtml = doc.blocks.map(blockToHtml).join('\n');
  const now = new Date().toLocaleDateString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(doc.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      color: #1e293b;
      line-height: 1.6;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    /* Header bar */
    .doc-header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 16px;
      margin-bottom: 32px;
    }
    .doc-title {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .doc-meta {
      font-size: 12px;
      color: #94a3b8;
    }
    /* Footer */
    .doc-footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
    a { color: #3b82f6; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1 class="doc-title">${escHtml(doc.title)}</h1>
    <p class="doc-meta">Exported on ${now}</p>
  </div>

  ${blocksHtml}

  <div class="doc-footer">
    Generated from TicketFlow Documentation
  </div>
</body>
</html>`;
}

// ── Public export function ────────────────────────────────────────────────────

export async function exportDocToPdf(doc: Doc): Promise<void> {
  const html = docToHtml(doc);

  // Generate PDF file
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Share / save the PDF
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Export: ${doc.title}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    // Fallback: open print dialog
    await Print.printAsync({ uri });
  }
}
