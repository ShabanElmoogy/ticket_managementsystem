# Docs Feature — Enhancement Backlog

Ordered by impact vs effort. Each item has a concrete implementation path.

---

## � Medium Priority (1–3 days each)

---

### 5. Undo / Redo

**Problem:** Any accidental edit or delete is permanent. No way to recover.

**File:** `hooks/useDocsStore.ts`

**Implementation:**
- Add `past: DocBlock[][]` and `future: DocBlock[][]` arrays to store state
- Before every `updateBlock`, `removeBlock`, `moveBlock`, `duplicateBlock` — push current `blocks` to `past`
- `undo()` — pop from `past`, push current to `future`, restore
- `redo()` — pop from `future`, push current to `past`, restore
- Limit history to 50 snapshots
- Add ↩ ↪ buttons to the doc header

```ts
undo: () => {
  const { past, future, docs, currentDocId } = get();
  if (!past.length || !currentDocId) return;
  const prev = past[past.length - 1];
  const current = docs.find(d => d.id === currentDocId)?.blocks ?? [];
  set({
    past: past.slice(0, -1),
    future: [current, ...future.slice(0, 49)],
    docs: docs.map(d => d.id === currentDocId ? { ...d, blocks: prev } : d),
  });
},
```

---

### 6. Drag-and-drop block reordering

**Problem:** Moving blocks with ↑↓ buttons is tedious for large docs.

**Package:** `react-native-draggable-flatlist` (already in replication plan)

**File:** `components/DocEditor.tsx`

**Implementation:**
- Replace `FlatList` with `DraggableFlatList`
- `onDragEnd` calls `dropBlock(targetId)` (already in store)
- Show drag handle icon (☰) on the left of each `BlockContainer`

```tsx
<DraggableFlatList
  data={blocks}
  keyExtractor={(b) => b.id}
  onDragEnd={({ data }) => reorderBlocks(data.map(b => b.id))}
  renderItem={({ item, drag }) => (
    <BlockContainer block={item} onDragStart={drag} ... />
  )}
/>
```

---

### 7. Rich text for text blocks

**Problem:** `TextBlock` stores `html` but the editor is a plain `TextInput`. No bold, italic, or links.

**Package:** `react-native-pell-rich-editor` or `@10play/tentap-editor`

**File:** `components/blockEditors/TextBlockEditor.tsx`

**Implementation:**
- Replace `TextInput` with a rich text editor component
- Toolbar: Bold, Italic, Underline, Link, Bullet list
- Store the output as HTML in `block.html`
- Preview already renders HTML via `PreviewText`

---

### 8. Export doc to PDF

**Problem:** No way to share or print a document.

**Package:** `expo-print` + `expo-sharing`

**File:** New `utils/exportDoc.ts`

**Implementation:**
```ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function exportDocToPdf(doc: Doc): Promise<void> {
  const html = renderDocToHtml(doc); // convert blocks to HTML string
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
}
```

Add an "Export PDF" button in the doc header (admin only).

---

### 9. Block search across content

**Problem:** No way to find which doc contains specific text.

**File:** New `components/DocSearch.tsx`

**Implementation:**
- Search input in the tree sidebar header
- `useMemo` filter across all docs' block content:
  - `HeadingBlock.text`
  - `TextBlock.html` (strip tags)
  - `CodeBlock.code`
  - `QuoteBlock.text`
- Show results as a flat list with doc name + matching block preview
- Tap result → open that doc and scroll to the block

---

### 10. Block templates / snippets

**Problem:** Users repeat the same block structures (e.g., a callout + code block combo).

**File:** New `hooks/useBlockTemplates.ts` + `components/BlockTemplatesPicker.tsx`

**Implementation:**
- "Save as template" option in block toolbar (⧉ → "Save as template")
- Templates stored in AsyncStorage as `{ id, name, blocks: DocBlock[] }`
- Show templates section at the bottom of `BlockPalette`
- Tap template → inserts all its blocks at current position

---

## 🟢 High Value, Higher Effort (1–2 weeks each)

---

### 11. Real-time collaboration via socket

**Problem:** Two users editing the same doc overwrite each other's changes.

**Files:** `hooks/useDocsStore.ts` + `services/socketService.ts`

**Implementation:**
- On `updateBlock` → emit `doc:block:update` with `{ docId, blockId, patch }`
- Socket listener in `DocsScreen` → calls `updateBlock` without re-emitting
- Add "who's viewing" presence indicator in the header
- Debounce emissions to avoid flooding (already have 1.5s debounce for saves)

```ts
// In updateBlock
socket.emit('doc:block:update', { docId: currentDocId, blockId: id, patch });

// In DocsScreen useEffect
socket.on('doc:block:update', ({ docId, blockId, patch }) => {
  if (docId === currentDocId) updateBlockSilent(blockId, patch);
});
```

---

### 12. Version history

**Problem:** No way to see or restore previous versions of a document.

**Backend:** Add `doc_versions` table — snapshot `blocks` JSON on each save with `userId` + `createdAt`

**Frontend:** "History" panel in the sidebar showing a timeline of saves. Tap a version → preview it. "Restore" button applies it as the current blocks.

---

### 13. Role-based permissions

**Problem:** All users can edit all docs. Some docs should be read-only for non-admins.

**Backend:** Add `permissions` field to docs table: `'public' | 'admin_only' | 'tenant_only'`

**Frontend:**
- Check `user.role` before showing editor vs preview
- Show lock icon on restricted docs in the tree
- Admin can set permissions per doc in a settings panel

---

### 14. Offline support

**Problem:** The app requires network for all doc operations.

**Implementation:**
- Cache all docs + tree in AsyncStorage on load
- Queue mutations (block edits, renames) when offline
- Sync queue when connection restores
- Show "Offline" indicator in the header

---

## Implementation Order

```
Week 1 — Quick wins: ✅ DONE
  ✅ 1. Deep clone on duplicate
  ✅ 2. Insert block between blocks
  ✅ 3. Error toasts
  ✅ 4. Search in tree sidebar

Week 2 — Core UX:
  ⏳ 5. Undo / Redo
  ⏳ 6. Drag-and-drop reordering
  ⏳ 7. Rich text editor

Week 3 — Power features:
  ⏳ 8. Export to PDF
  ⏳ 9. Block search
  ⏳ 10. Block templates

Future:
  ⏳ 11. Real-time collaboration
  ⏳ 12. Version history
  ⏳ 13. Role-based permissions
  ⏳ 14. Offline support
```

---

## Current Block Types (17)

| Type | Editor | Preview | Notes |
|---|---|---|---|
| `heading` | ✅ | ✅ | H1/H2/H3, color, align |
| `text` | ✅ | ✅ | Plain text only — needs rich text |
| `divider` | ✅ | ✅ | Color + thickness |
| `image` | ✅ | ✅ | URL + upload + camera |
| `video` | ✅ | ✅ | YouTube + upload + camera |
| `bulletedList` | ✅ | ✅ | |
| `numberedList` | ✅ | ✅ | |
| `code` | ✅ | ✅ | Language selector + syntax highlight |
| `quote` | ✅ | ✅ | Attribution field |
| `callout` | ✅ | ✅ | info/warning/success/error |
| `table` | ✅ | ✅ | Add/remove rows + cols |
| `toggle` | ✅ | ✅ | Collapsible content |
| `tabs` | ✅ | ✅ | Multiple tab panels |
| `videoCarousel` | ✅ | ✅ | Multiple videos, nav arrows |
| `imageCarousel` | ✅ | ✅ | Multiple images, dot indicators |
| `pdf` | ✅ | ✅ | Upload + inline viewer + fullscreen |
| `excel` | ✅ | ✅ | Upload + SheetJS viewer + fullscreen |

### Missing block types to consider

| Type | Description |
|---|---|
| `button` | CTA button with label, URL, color |
| `embed` | iFrame embed (Figma, Loom, Google Maps) |
| `file` | Generic downloadable file attachment |
| `rating` | Star rating display |
| `separator` | Styled section break with label |
| `columns` | Two-column layout container |
