# PDF Export Rule

## Libraries

Use `jspdf` + `jspdf-autotable` — already installed in `web/package.json`. Never install alternatives.

```ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
```

---

## Two Patterns — Choose the Right One

### Pattern A — Direct jsPDF (entity detail pages)
Use when exporting a single entity with rich layout (header bar, metadata, tables, footer).
Reference implementation: `web/src/components/epics/utils/exportEpicPdf.ts`

### Pattern B — Template-based (admin/list reports)
Use when generating tabular reports with shared header/footer chrome.
Reference implementation: `web/src/utils/reports/reportTemplate.ts` + `customersTicketReport.ts`

---

## Pattern A — Direct jsPDF

### File location
```
web/src/components/<feature>/utils/export<Entity>Pdf.ts
```

### Skeleton
```ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function export<Entity>Pdf(entity: Entity, relatedItems: RelatedItem[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  // 1. Header bar
  doc.setFillColor(25, 118, 210);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Title', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${new Date().toLocaleString()}`, pageW - margin, 14, { align: 'right' });
  y = 30;
  doc.setTextColor(0, 0, 0);

  // 2. Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(entity.title, margin, y);
  y += 8;

  // 3. Metadata grid (key/value pairs)
  autoTable(doc, {
    startY: y,
    head: [],
    body: [['Label', 'Value'], /* ... */],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: [80, 80, 80] },
      1: { textColor: [30, 30, 30] },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // 4. Data table
  autoTable(doc, {
    startY: y,
    head: [['Col1', 'Col2']],
    body: relatedItems.map((item) => [item.field1, item.field2]),
    theme: 'striped',
    headStyles: { fillColor: [25, 118, 210], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5 },
    margin: { left: margin, right: margin },
  });

  // 5. Footer on every page
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Page ${i} of ${pageCount}  ·  ${entity.title}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  // 6. Save
  const safeName = entity.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`<entity>_${safeName}.pdf`);
}
```

### Rules
- Always track `y` position and advance it after each section
- Use `(doc as any).lastAutoTable.finalY` to get the Y after each `autoTable` call
- Sanitize the filename: `.replace(/[^a-z0-9]/gi, '_').toLowerCase()`
- Draw the per-page footer in a loop over `getNumberOfPages()` — not in `didDrawPage`
- Use `mm` units and `a4` format for consistency

---

## Pattern B — Template-based

### File location
```
web/src/utils/reports/<reportName>Report.ts
```

### Skeleton
```ts
import { createReport, addSectionTitle, addTable, saveReport } from './reportTemplate';

export function generate<Name>Report(rows: Row[], options: ReportOptions = {}): void {
  const ctx = createReport({
    title: options.title ?? 'My Report',
    companyName: options.companyName,
    filters: options.filters ?? {},
    page: { orientation: options.orientation ?? 'landscape' },
  });

  addTable(ctx, {
    head: [['Col1', 'Col2']],
    body: rows.map((r) => [r.field1, r.field2]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [33, 150, 243], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  saveReport(ctx, options.filename);
}
```

### Available helpers (`reportTemplate.ts`)
| Helper | Purpose |
|---|---|
| `createReport(options)` | Creates jsPDF doc + header/footer hook |
| `addSectionTitle(ctx, label, y)` | Renders a bold section heading, returns new Y |
| `addTable(ctx, tableOptions)` | Wraps `autoTable`, returns finalY |
| `saveReport(ctx, filename?)` | Calls `putTotalPages` then `doc.save` |
| `defaultFileName(title)` | `Title_YYYY-MM-DD.pdf` |

---

## Button Placement

- Place the Export PDF button in the page header, admin-only
- Use MUI `<Button startIcon={<PictureAsPdf />} variant="outlined" size="small" color="error">`
- Call the export function directly from `onClick` — no async needed
- Guard with role check: only render for `TENANT_ADMIN` / `SUPER_ADMIN`

```tsx
{isAdmin && (
  <Button
    startIcon={<PictureAsPdf />}
    variant="outlined"
    size="small"
    color="error"
    onClick={() => exportEntityPdf(entity, relatedItems)}
  >
    Export PDF
  </Button>
)}
```

---

## Checklist

- [ ] Create `export<Entity>Pdf.ts` in `web/src/components/<feature>/utils/`
- [ ] Import `jsPDF` and `autoTable` from the installed packages
- [ ] Header bar → title → metadata grid → data table → per-page footer
- [ ] Sanitize filename before `doc.save()`
- [ ] Add button to page header, guarded by admin role check
- [ ] Use `startIcon={<PictureAsPdf />}` from `@mui/icons-material`
