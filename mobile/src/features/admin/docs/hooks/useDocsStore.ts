import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BlockType, BlockSettings, DocBlock, Doc, TreeNode, FolderNode, DocRefNode,
  HeadingBlock, TextBlock, DividerBlock, ImageBlock, VideoBlock,
  BulletedListBlock, CodeBlock,
} from '../types/types';
import { newId } from '../utils/idUtils';
import { docsApi } from '../api/docs';
import { buildTree, findNode, insertChild, mapTree, removeNode, collectDocIds } from '../utils/treeUtils';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface DocsState {
  docs:           Doc[];
  currentDocId:   string | null;
  preview:        boolean;
  dragId:         string | null;
  tree:           TreeNode[];
  expanded:       Record<string, boolean>;
  selectedTreeId: string | null;
  saveStatus:     SaveStatus;

  setCurrentDocId:   (id: string | null) => void;
  setPreview:        (v: boolean) => void;
  setSelectedTreeId: (id: string | null) => void;
  setSaveStatus:     (s: SaveStatus) => void;

  loadAll: () => Promise<void>;

  addBlock:            (type: BlockType) => Promise<void>;
  insertBlock:         (type: BlockType, afterIndex: number) => Promise<void>;
  updateBlock:         <T extends DocBlock>(id: string, patch: Partial<T>) => void;
  updateBlockSettings: (id: string, patch: Partial<BlockSettings>) => void;
  removeBlock:         (id: string) => void;
  duplicateBlock:      (id: string) => void;
  moveBlock:           (id: string, dir: -1 | 1) => void;
  setDragId:           (id: string | null) => void;
  dropBlock:           (targetId: string) => void;

  addFolder:         (parentId: string | null) => Promise<void>;
  addDocUnder:       (parentId: string | null) => Promise<void>;
  renameNode:        (id: string, newTitle: string) => Promise<void>;
  deleteNodeAndDocs: (id: string) => Promise<void>;
  toggleExpand:      (id: string) => void;
  setFolderIcon:     (id: string, icon: string) => void;

  saveCurrentDoc:      () => Promise<void>;
  renameCurrentDoc:    (title: string) => Promise<void>;
  duplicateCurrentDoc: () => Promise<void>;
  duplicateDoc:        (docId: string) => Promise<void>;
  deleteDoc:           (docId: string) => Promise<void>;
  resetCurrent:        () => void;
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
    case 'heading':       return { ...base, type: 'heading',       text: '' } as HeadingBlock;
    case 'text':          return { ...base, type: 'text',          html: '' } as TextBlock;
    case 'divider':       return { ...base, type: 'divider' } as DividerBlock;
    case 'image':         return { ...base, type: 'image',         url: '', caption: '' } as ImageBlock;
    case 'video':         return { ...base, type: 'video',         url: '', caption: '' } as VideoBlock;
    case 'bulletedList':  return { ...base, type: 'bulletedList',  title: '', items: [''] } as BulletedListBlock;
    case 'numberedList':  return { ...base, type: 'numberedList',  title: '', items: [''] } as DocBlock;
    case 'code':          return { ...base, type: 'code',          language: 'javascript', code: '' } as CodeBlock;
    case 'quote':         return { ...base, type: 'quote',         text: '', attribution: '' } as DocBlock;
    case 'callout':       return { ...base, type: 'callout',       calloutType: 'info', text: '' } as DocBlock;
    case 'table':         return { ...base, type: 'table',         headers: ['Column 1', 'Column 2'], rows: [['', '']] } as DocBlock;
    case 'toggle':        return { ...base, type: 'toggle',        summary: '', content: '' } as DocBlock;
    case 'tabs':          return { ...base, type: 'tabs',          tabs: [{ id: newId(), label: 'Tab 1', content: '' }, { id: newId(), label: 'Tab 2', content: '' }] } as DocBlock;
    case 'videoCarousel': return { ...base, type: 'videoCarousel', videos: [] } as DocBlock;
    case 'imageCarousel': return { ...base, type: 'imageCarousel', images: [] } as DocBlock;
    case 'pdf':           return { ...base, type: 'pdf',   url: '', name: '' } as DocBlock;
    case 'excel':         return { ...base, type: 'excel', url: '', name: '' } as DocBlock;
    default:              return base;
  }
}

// ── Folder icon persistence (AsyncStorage) ────────────────────────────────────

const ICONS_KEY = 'docs_folder_icons';

async function loadFolderIcons(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(ICONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveFolderIcons(icons: Record<string, string>) {
  try { await AsyncStorage.setItem(ICONS_KEY, JSON.stringify(icons)); } catch {}
}

function applyIcons(tree: TreeNode[], icons: Record<string, string>): TreeNode[] {
  return tree.map((n) => {
    if (n.type === 'folder') {
      const withIcon = icons[n.id] ? { ...n, icon: icons[n.id] } : n;
      return { ...withIcon, children: applyIcons((withIcon as any).children, icons) };
    }
    return n;
  });
}

// ── Auto-save debounce ────────────────────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(getState: () => DocsState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const state = getState();
    const doc = state.docs.find((d) => d.id === state.currentDocId);
    if (!doc) return;
    state.setSaveStatus('saving');
    const ok = await docsApi.saveDoc(doc);
    state.setSaveStatus(ok ? 'saved' : 'error');
    setTimeout(() => getState().setSaveStatus('idle'), 2000);
  }, 1500);
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDocsStore = create<DocsState>((set, get) => ({
  docs:           [],
  currentDocId:   null,
  preview:        false,
  dragId:         null,
  tree:           [],
  expanded:       {},
  selectedTreeId: null,
  saveStatus:     'idle',

  setCurrentDocId:   (id) => set({ currentDocId: id, preview: false }),
  setPreview:        (v)  => set({ preview: v }),
  setSelectedTreeId: (id) => set({ selectedTreeId: id }),
  setSaveStatus:     (s)  => set({ saveStatus: s }),
  setDragId:         (id) => set({ dragId: id }),

  // ── Init ──────────────────────────────────────────────────────────────────

  loadAll: async () => {
    const [rawDocs, rawTree, icons] = await Promise.all([
      docsApi.loadDocs(),
      docsApi.loadTree(),
      loadFolderIcons(),
    ]);
    const docs = (rawDocs ?? []).map((d) => ({ ...d, blocks: parseBlocks(d.blocks) }));
    const tree = applyIcons(buildTree(rawTree ?? []), icons);
    set({ docs, tree });
  },

  // ── Block operations ──────────────────────────────────────────────────────

  addBlock: async (type) => {
    const { currentDocId, docs } = get();
    if (!currentDocId) return;
    const block = makeBlock(type);
    set({
      docs: docs.map((d) =>
        d.id === currentDocId ? { ...d, blocks: [...d.blocks, block] } : d
      ),
    });
    scheduleSave(get);
  },

  insertBlock: async (type, afterIndex) => {
    const { currentDocId, docs } = get();
    if (!currentDocId) return;
    const block = makeBlock(type);
    set({
      docs: docs.map((d) => {
        if (d.id !== currentDocId) return d;
        const blocks = [...d.blocks];
        blocks.splice(afterIndex + 1, 0, block);
        return { ...d, blocks };
      }),
    });
    scheduleSave(get);
  },

  updateBlock: (id, patch) => {
    const { currentDocId, docs } = get();
    if (!currentDocId) return;
    set({
      docs: docs.map((d) =>
        d.id === currentDocId
          ? { ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) }
          : d
      ),
    });
    scheduleSave(get);
  },

  updateBlockSettings: (id, patch) => {
    const { currentDocId, docs } = get();
    if (!currentDocId) return;
    set({
      docs: docs.map((d) =>
        d.id === currentDocId
          ? {
              ...d,
              blocks: d.blocks.map((b) =>
                b.id === id ? { ...b, settings: { ...b.settings, ...patch } } : b
              ),
            }
          : d
      ),
    });
    scheduleSave(get);
  },

  removeBlock: (id) => {
    const { currentDocId, docs } = get();
    if (!currentDocId) return;
    set({
      docs: docs.map((d) =>
        d.id === currentDocId ? { ...d, blocks: d.blocks.filter((b) => b.id !== id) } : d
      ),
    });
    scheduleSave(get);
  },

  duplicateBlock: (id) => {
    const { currentDocId, docs } = get();
    if (!currentDocId) return;
    set({
      docs: docs.map((d) => {
        if (d.id !== currentDocId) return d;
        const idx = d.blocks.findIndex((b) => b.id === id);
        if (idx === -1) return d;
        const clone = { ...d.blocks[idx], id: newId() };
        const blocks = [...d.blocks];
        blocks.splice(idx + 1, 0, clone);
        return { ...d, blocks };
      }),
    });
    scheduleSave(get);
  },

  moveBlock: (id, dir) => {
    const { currentDocId, docs } = get();
    if (!currentDocId) return;
    set({
      docs: docs.map((d) => {
        if (d.id !== currentDocId) return d;
        const blocks = [...d.blocks];
        const idx = blocks.findIndex((b) => b.id === id);
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= blocks.length) return d;
        [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
        return { ...d, blocks };
      }),
    });
    scheduleSave(get);
  },

  dropBlock: (targetId) => {
    const { currentDocId, docs, dragId } = get();
    if (!currentDocId || !dragId || dragId === targetId) return;
    set({
      docs: docs.map((d) => {
        if (d.id !== currentDocId) return d;
        const blocks = [...d.blocks];
        const fromIdx = blocks.findIndex((b) => b.id === dragId);
        const toIdx   = blocks.findIndex((b) => b.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return d;
        const [moved] = blocks.splice(fromIdx, 1);
        blocks.splice(toIdx, 0, moved);
        return { ...d, blocks };
      }),
      dragId: null,
    });
    scheduleSave(get);
  },

  // ── Tree operations ───────────────────────────────────────────────────────

  addFolder: async (parentId) => {
    const node = await docsApi.createFolder('New Folder', parentId);
    const newFolder: FolderNode = { id: node.id, type: 'folder', title: node.title, children: [] };
    set((s) => ({ tree: insertChild(s.tree, parentId, newFolder) }));
  },

  addDocUnder: async (parentId) => {
    const doc  = await docsApi.createDoc('Untitled', []);
    const node = await docsApi.createDocNode(doc.title, parentId, doc.id);
    const docRef: DocRefNode = { id: node.id, type: 'doc', title: doc.title, docId: doc.id };
    set((s) => ({
      docs: [...s.docs, { ...doc, blocks: [] }],
      tree: insertChild(s.tree, parentId, docRef),
      currentDocId: doc.id,
      selectedTreeId: node.id,
    }));
  },

  renameNode: async (id, newTitle) => {
    await docsApi.renameNode(id, newTitle);
    set((s) => ({
      tree: mapTree(s.tree, (n) => (n.id === id ? { ...n, title: newTitle } : n)),
      docs: s.docs.map((d) => {
        const node = s.tree.find((n) => n.type === 'doc' && (n as DocRefNode).docId === d.id);
        return node?.id === id ? { ...d, title: newTitle } : d;
      }),
    }));
  },

  deleteNodeAndDocs: async (id) => {
    const { tree } = get();
    const node = findNode(tree, id);
    if (!node) return;
    const docIds = collectDocIds(node);
    await docsApi.deleteNode(id);
    const { nodes: newTree } = removeNode(tree, id);
    set((s) => ({
      tree: newTree,
      docs: s.docs.filter((d) => !docIds.includes(d.id)),
      currentDocId: docIds.includes(s.currentDocId ?? '') ? null : s.currentDocId,
      selectedTreeId: s.selectedTreeId === id ? null : s.selectedTreeId,
    }));
  },

  toggleExpand: (id) =>
    set((s) => ({ expanded: { ...s.expanded, [id]: !s.expanded[id] } })),

  setFolderIcon: (id, icon) => {
    set((s) => ({
      tree: mapTree(s.tree, (n) => (n.id === id ? { ...n, icon } : n)),
    }));
    loadFolderIcons().then((icons) => saveFolderIcons({ ...icons, [id]: icon }));
  },

  // ── Doc operations ────────────────────────────────────────────────────────

  saveCurrentDoc: async () => {
    const { currentDocId, docs } = get();
    const doc = docs.find((d) => d.id === currentDocId);
    if (!doc) return;
    set({ saveStatus: 'saving' });
    const ok = await docsApi.saveDoc(doc);
    set({ saveStatus: ok ? 'saved' : 'error' });
    setTimeout(() => get().setSaveStatus('idle'), 2000);
  },

  renameCurrentDoc: async (title) => {
    const { currentDocId } = get();
    if (!currentDocId) return;
    set((s) => ({
      docs: s.docs.map((d) => (d.id === currentDocId ? { ...d, title } : d)),
      tree: mapTree(s.tree, (n) =>
        n.type === 'doc' && (n as DocRefNode).docId === currentDocId ? { ...n, title } : n
      ),
    }));
    scheduleSave(get);
  },

  duplicateCurrentDoc: async () => {
    const { currentDocId } = get();
    if (!currentDocId) return;
    get().duplicateDoc(currentDocId);
  },

  duplicateDoc: async (docId) => {
    const { docs, tree } = get();
    const src = docs.find((d) => d.id === docId);
    if (!src) return;
    const newDoc  = await docsApi.createDoc(`${src.title} (copy)`, src.blocks.map((b) => ({ ...b, id: newId() })));
    // Find parent of the original node
    const findParent = (nodes: typeof tree, targetDocId: string): string | null => {
      for (const n of nodes) {
        if (n.type === 'folder') {
          if (n.children.some((c) => c.type === 'doc' && (c as DocRefNode).docId === targetDocId)) return n.id;
          const found = findParent(n.children, targetDocId);
          if (found) return found;
        }
      }
      return null;
    };
    const parentId = findParent(tree, docId);
    const node = await docsApi.createDocNode(newDoc.title, parentId, newDoc.id);
    const docRef: DocRefNode = { id: node.id, type: 'doc', title: newDoc.title, docId: newDoc.id };
    set((s) => ({
      docs: [...s.docs, { ...newDoc, blocks: parseBlocks(newDoc.blocks) }],
      tree: insertChild(s.tree, parentId, docRef),
    }));
  },

  deleteDoc: async (docId) => {
    const { tree } = get();
    // Find the tree node for this doc
    const findDocNode = (nodes: typeof tree): DocRefNode | null => {
      for (const n of nodes) {
        if (n.type === 'doc' && (n as DocRefNode).docId === docId) return n as DocRefNode;
        if (n.type === 'folder') {
          const found = findDocNode(n.children);
          if (found) return found;
        }
      }
      return null;
    };
    const treeNode = findDocNode(tree);
    if (treeNode) await docsApi.deleteNode(treeNode.id);
    const { nodes: newTree } = treeNode ? removeNode(tree, treeNode.id) : { nodes: tree };
    set((s) => ({
      docs: s.docs.filter((d) => d.id !== docId),
      tree: newTree,
      currentDocId: s.currentDocId === docId ? null : s.currentDocId,
    }));
  },

  resetCurrent: () => {
    const { currentDocId } = get();
    if (!currentDocId) return;
    set((s) => ({
      docs: s.docs.map((d) => (d.id === currentDocId ? { ...d, blocks: [] } : d)),
    }));
    scheduleSave(get);
  },
}));

// ── Derived selector ──────────────────────────────────────────────────────────

// Use a stable equality check — only re-render when the actual doc content changes
export const useCurrentDoc = () =>
  useDocsStore((s) => {
    const doc = s.docs.find((d) => d.id === s.currentDocId);
    if (!doc) return null;
    // blocks are always stored as arrays in the store (parseBlocks is called on load)
    // so we can return the doc directly — no new object needed
    return doc;
  });
