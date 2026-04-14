import { create } from 'zustand';
import type {
  BlockType, BlockSettings, DocBlock, Doc, TreeNode, FolderNode, DocRefNode,
  HeadingBlock, TextBlock, DividerBlock, ImageBlock, VideoBlock, BulletedListBlock, CodeBlock,
} from '../types/types.ts';
import { newId } from '../utils/idUtils';
import { docsApi } from '../api/docs';
import { buildTree, findNode, insertChild, mapTree, removeNode, collectDocIds } from '../utils/treeUtils';

// ── State shape ───────────────────────────────────────────────────────────────

interface DocsState {
  docs:           Doc[];
  currentDocId:   string | null;
  preview:        boolean;
  dragId:         string | null;
  tree:           TreeNode[];
  expanded:       Record<string, boolean>;
  selectedTreeId: string | null;

  // ── Setters ────────────────────────────────────────────────────────────────
  setCurrentDocId:   (id: string | null) => void;
  setPreview:        (v: boolean) => void;
  setSelectedTreeId: (id: string | null) => void;

  // ── Init ───────────────────────────────────────────────────────────────────
  loadAll: () => Promise<void>;

  // ── Block operations ───────────────────────────────────────────────────────
  addBlock:            (type: BlockType) => Promise<void>;
  updateBlock:         <T extends DocBlock>(id: string, patch: Partial<T>) => void;
  updateBlockSettings: (id: string, patch: Partial<BlockSettings>) => void;
  removeBlock:         (id: string) => void;
  moveBlock:           (id: string, dir: -1 | 1) => void;
  setDragId:           (id: string | null) => void;
  dropBlock:           (targetId: string) => void;

  // ── Tree operations ────────────────────────────────────────────────────────
  addFolder:         (parentId: string | null) => Promise<void>;
  addDocUnder:       (parentId: string | null) => Promise<void>;
  renameNode:        (id: string, newTitle: string) => Promise<void>;
  deleteNodeAndDocs: (id: string) => Promise<void>;
  toggleExpand:      (id: string) => void;

  // ── Doc operations ─────────────────────────────────────────────────────────
  saveCurrentDoc: () => Promise<void>;
  deleteDoc:      (docId: string) => Promise<void>;
  resetCurrent:   () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseBlocks(raw: unknown): DocBlock[] {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return Array.isArray(raw) ? raw : [];
}

function makeBlock(type: BlockType): DocBlock {
  const base = { id: newId(), type, settings: {} } as DocBlock;
  switch (type) {
    case 'heading':      return { ...base, type: 'heading',      text: '' } as HeadingBlock;
    case 'text':         return { ...base, type: 'text',         html: '' } as TextBlock;
    case 'divider':      return { ...base, type: 'divider' } as DividerBlock;
    case 'image':        return { ...base, type: 'image',        url: '', caption: '' } as ImageBlock;
    case 'video':        return { ...base, type: 'video',        url: '', caption: '' } as VideoBlock;
    case 'bulletedList': return { ...base, type: 'bulletedList', title: '', items: [''] } as BulletedListBlock;
    case 'numberedList': return { ...base, type: 'numberedList', title: '', items: [''] } as DocBlock;
    case 'code':         return { ...base, type: 'code',         language: 'javascript', code: '' } as CodeBlock;
    case 'quote':        return { ...base, type: 'quote',        text: '', attribution: '' } as DocBlock;
    case 'callout':      return { ...base, type: 'callout',      calloutType: 'info', text: '' } as DocBlock;
    case 'table':        return { ...base, type: 'table',        headers: ['Column 1', 'Column 2'], rows: [['', '']] } as DocBlock;
    case 'toggle':       return { ...base, type: 'toggle',       summary: '', content: '' } as DocBlock;
    case 'tabs':         return { ...base, type: 'tabs',         tabs: [{ id: newId(), label: 'Tab 1', content: '' }, { id: newId(), label: 'Tab 2', content: '' }] } as DocBlock;
    default:             return base;
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDocsStore = create<DocsState>()((set, get) => ({
  docs:           [],
  currentDocId:   null,
  preview:        false,
  dragId:         null,
  tree:           [],
  expanded:       {},
  selectedTreeId: null,

  setCurrentDocId:   (id) => set({ currentDocId: id }),
  setPreview:        (v)  => set({ preview: v }),
  setSelectedTreeId: (id) => set({ selectedTreeId: id }),
  setDragId:         (id) => set({ dragId: id }),

  // ── Init ───────────────────────────────────────────────────────────────────
  loadAll: async () => {
    const [serverDocs, serverNodes] = await Promise.all([
      docsApi.loadDocs(),
      docsApi.loadTree(),
    ]);

    const docs = (Array.isArray(serverDocs) ? serverDocs : []).map((d) => ({
      ...d,
      blocks: parseBlocks(d.blocks),
    }));

    set({
      docs,
      currentDocId: docs.length ? docs[0].id : null,
      tree: serverNodes ? buildTree(serverNodes) : [],
    });
  },

  // ── Block operations ───────────────────────────────────────────────────────
  addBlock: async (type) => {
    const { docs, currentDocId, selectedTreeId, tree } = get();
    const block = makeBlock(type);

    const currentDoc = docs.find((d) => d.id === currentDocId) ?? null;

    if (!currentDoc) {
      if (currentDocId) {
        // Doc not in local state — fetch then append
        try {
          const fetched = await docsApi.getDoc(currentDocId);
          const blocks = [...parseBlocks(fetched.blocks), block];
          const updated = { ...fetched, id: currentDocId, blocks, updatedAt: new Date().toISOString() };
          set((s) => ({
            docs: s.docs.some((d) => d.id === currentDocId)
              ? s.docs.map((d) => d.id === currentDocId ? updated : d)
              : [updated, ...s.docs],
          }));
        } catch (err) {
          console.error('[useDocsStore] error fetching doc:', err);
        }
        return;
      }

      // No doc at all — create one
      const parentId = selectedTreeId && findNode(tree, selectedTreeId)?.type === 'folder' ? selectedTreeId : null;
      const initialBlocks: DocBlock[] = [
        { id: newId(), type: 'heading', text: 'New Document', settings: { align: 'left' } } as HeadingBlock,
        block,
      ];
      const created = await docsApi.createDoc('Untitled', initialBlocks);
      const node    = await docsApi.createDocNode(created.title, parentId, created.id);
      const localNode: DocRefNode = { id: node.id, type: 'doc', title: node.title, docId: created.id };
      const parsedDoc = { ...created, blocks: parseBlocks(created.blocks) };
      set((s) => ({
        docs:         [parsedDoc, ...s.docs],
        tree:         insertChild(s.tree, parentId, localNode),
        currentDocId: created.id,
      }));
      return;
    }

    set((s) => ({
      docs: s.docs.map((d) =>
        d.id === currentDoc.id
          ? { ...d, blocks: [...(d.blocks ?? []), block], updatedAt: new Date().toISOString() }
          : d,
      ),
    }));
  },

  updateBlock: (id, patch) => {
    const { docs, currentDocId } = get();
    const currentDoc = docs.find((d) => d.id === currentDocId);
    if (!currentDoc) return;
    set((s) => ({
      docs: s.docs.map((d) =>
        d.id === currentDoc.id
          ? { ...d, blocks: d.blocks.map((b) => b.id === id ? ({ ...b, ...patch } as DocBlock) : b), updatedAt: new Date().toISOString() }
          : d,
      ),
    }));
  },

  updateBlockSettings: (id, patch) => {
    const { docs, currentDocId } = get();
    const currentDoc = docs.find((d) => d.id === currentDocId);
    if (!currentDoc) return;
    set((s) => ({
      docs: s.docs.map((d) =>
        d.id === currentDoc.id
          ? { ...d, blocks: d.blocks.map((b) => b.id === id ? ({ ...b, settings: { ...b.settings, ...patch } } as DocBlock) : b), updatedAt: new Date().toISOString() }
          : d,
      ),
    }));
  },

  removeBlock: (id) => {
    const { docs, currentDocId } = get();
    const currentDoc = docs.find((d) => d.id === currentDocId);
    if (!currentDoc) return;
    const updated: Doc = { ...currentDoc, blocks: currentDoc.blocks.filter((b: DocBlock) => b.id !== id), updatedAt: new Date().toISOString() };
    set((s) => ({ docs: s.docs.map((d) => d.id === currentDoc.id ? updated : d) }));
    docsApi.saveDoc(updated); // fire-and-forget
  },

  moveBlock: (id, dir) => {
    const { docs, currentDocId } = get();
    const currentDoc = docs.find((d) => d.id === currentDocId);
    if (!currentDoc) return;
    set((s) => ({
      docs: s.docs.map((d) => {
        if (d.id !== currentDoc.id) return d;
        const idx = d.blocks.findIndex((b) => b.id === id);
        if (idx === -1) return d;
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= d.blocks.length) return d;
        const copy = [...d.blocks];
        const [item] = copy.splice(idx, 1);
        copy.splice(newIdx, 0, item);
        return { ...d, blocks: copy, updatedAt: new Date().toISOString() };
      }),
    }));
  },

  dropBlock: (targetId) => {
    const { docs, currentDocId, dragId } = get();
    const currentDoc = docs.find((d) => d.id === currentDocId);
    if (!currentDoc || !dragId || dragId === targetId) return;
    const from = currentDoc.blocks.findIndex((b: DocBlock) => b.id === dragId);
    const to   = currentDoc.blocks.findIndex((b: DocBlock) => b.id === targetId);
    if (from === -1 || to === -1) return;
    set((s) => ({
      dragId: null,
      docs: s.docs.map((d) => {
        if (d.id !== currentDoc.id) return d;
        const copy = [...d.blocks];
        const [item] = copy.splice(from, 1);
        copy.splice(to, 0, item);
        return { ...d, blocks: copy, updatedAt: new Date().toISOString() };
      }),
    }));
  },

  // ── Tree operations ────────────────────────────────────────────────────────
  addFolder: async (parentId) => {
    const node   = await docsApi.createFolder('New Folder', parentId);
    const folder: FolderNode = { id: node.id, type: 'folder', title: node.title, children: [] };
    set((s) => ({
      tree:     insertChild(s.tree, parentId, folder),
      expanded: parentId ? { ...s.expanded, [parentId]: true } : s.expanded,
    }));
  },

  addDocUnder: async (parentId) => {
    const initialBlocks: DocBlock[] = [
      { id: newId(), type: 'heading', text: 'New Document', settings: { align: 'left' } } as HeadingBlock,
    ];
    const created   = await docsApi.createDoc('Untitled', initialBlocks);
    const node      = await docsApi.createDocNode(created.title, parentId, created.id);
    const localNode: DocRefNode = { id: node.id, type: 'doc', title: node.title, docId: created.id };
    // Ensure blocks are always a parsed array — server may return them as a JSON string
    const parsedDoc = { ...created, blocks: parseBlocks(created.blocks) };
    set((s) => ({
      docs:         [parsedDoc, ...s.docs],
      tree:         insertChild(s.tree, parentId, localNode),
      currentDocId: created.id,
      expanded:     parentId ? { ...s.expanded, [parentId]: true } : s.expanded,
    }));
  },

  renameNode: async (id, newTitle) => {
    const updated = await docsApi.renameNode(id, newTitle);
    const node    = findNode(get().tree, id);
    set((s) => ({
      tree: mapTree(s.tree, (n) => n.id === id ? { ...n, title: updated.title } : n),
      docs: node?.type === 'doc'
        ? s.docs.map((d) => d.id === node.docId ? { ...d, title: updated.title, updatedAt: new Date().toISOString() } : d)
        : s.docs,
    }));
  },

  deleteNodeAndDocs: async (id) => {
    let removedNode: TreeNode | null = null;
    set((s) => {
      const { nodes: newTree, removed } = removeNode(s.tree, id);
      removedNode = removed ?? null;
      return { tree: newTree };
    });
    await docsApi.deleteNode(id);
    if (removedNode) {
      const docIds = collectDocIds(removedNode);
      if (docIds.length) {
        set((s) => ({
          docs:         s.docs.filter((d) => !docIds.includes(d.id)),
          currentDocId: docIds.includes(s.currentDocId ?? '') ? null : s.currentDocId,
        }));
      }
    }
  },

  toggleExpand: (id) => set((s) => ({ expanded: { ...s.expanded, [id]: !s.expanded[id] } })),

  // ── Doc operations ─────────────────────────────────────────────────────────
  saveCurrentDoc: async () => {
    const { docs, currentDocId } = get();
    const currentDoc = docs.find((d) => d.id === currentDocId);
    if (currentDoc) await docsApi.saveDoc(currentDoc);
  },

  deleteDoc: async (docId) => {
    const { tree } = get();
    const allNodes  = tree.flatMap((n) => n.type === 'folder' ? [n, ...n.children] : [n]);
    const nodeToDelete = allNodes.find((n) => n.type === 'doc' && n.docId === docId);
    if (nodeToDelete) {
      await get().deleteNodeAndDocs(nodeToDelete.id);
    } else {
      set((s) => ({
        docs:         s.docs.filter((d) => d.id !== docId),
        currentDocId: s.currentDocId === docId ? null : s.currentDocId,
      }));
    }
  },

  resetCurrent: () => {
    const { docs, currentDocId } = get();
    const currentDoc = docs.find((d) => d.id === currentDocId);
    if (!currentDoc) return;
    set((s) => ({
      docs: s.docs.map((d) =>
        d.id === currentDoc.id ? { ...d, blocks: [], updatedAt: new Date().toISOString() } : d,
      ),
    }));
  },
}));

// ── Derived selector ──────────────────────────────────────────────────────────

/** Returns the current doc with blocks always parsed as an array. */
export function useCurrentDoc(): Doc | null {
  return useDocsStore((s) => {
    const doc = s.docs.find((d) => d.id === s.currentDocId) ?? null;
    if (!doc) return null;
    const blocks = parseBlocks(doc.blocks);
    if (blocks === doc.blocks) return doc;
    return { ...doc, blocks };
  });
}

/** DnD handlers for a given block id — stable references via store actions. */
export function useDndHandlers(blockId: string) {
  const setDragId  = useDocsStore((s) => s.setDragId);
  const dropBlock  = useDocsStore((s) => s.dropBlock);
  return {
    onDragStart: (e: React.DragEvent) => { setDragId(blockId); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver:  (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    onDrop:      (e: React.DragEvent) => { e.preventDefault(); dropBlock(blockId); },
  };
}
