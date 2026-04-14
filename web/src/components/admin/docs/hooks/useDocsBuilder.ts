import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BlockType, BlockSettings, DocBlock, Doc, TreeNode, FolderNode, DocRefNode,
  HeadingBlock, TextBlock, DividerBlock, ImageBlock, VideoBlock, BulletedListBlock, CodeBlock,
} from '../types/types.ts';
import { newId } from '../utils/idUtils';
import { docsApi } from '../api/docs';
import { buildTree, findNode, insertChild, mapTree, removeNode, collectDocIds } from '../utils/treeUtils';

export const useDocsBuilder = () => {
  const [docs,          setDocs]          = useState<Doc[]>([]);
  const [currentDocId,  setCurrentDocId]  = useState<string | null>(null);
  const [preview,       setPreview]       = useState(false);
  const [dragId,        setDragId]        = useState<string | null>(null);
  const [tree,          setTree]          = useState<TreeNode[]>([]);
  const [expanded,      setExpanded]      = useState<Record<string, boolean>>({});
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);

  // ── Derived current doc ────────────────────────────────────────────────────
  const currentDoc = useMemo(() => {
    const doc = docs.find((d) => d.id === currentDocId) ?? null;
    if (!doc) return null;
    if (typeof doc.blocks === 'string') {
      try { return { ...doc, blocks: JSON.parse(doc.blocks as unknown as string) }; }
      catch { return { ...doc, blocks: [] }; }
    }
    if (!Array.isArray(doc.blocks)) return { ...doc, blocks: [] };
    return doc;
  }, [docs, currentDocId]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const serverDocs = await docsApi.loadDocs();
      const rawDocs = Array.isArray(serverDocs) ? serverDocs : [];
      const parsed = rawDocs.map((d) => ({
        ...d,
        blocks: typeof d.blocks === 'string'
          ? (() => { try { return JSON.parse(d.blocks as unknown as string); } catch { return []; } })()
          : Array.isArray(d.blocks) ? d.blocks : [],
      }));
      setDocs(parsed);
      setCurrentDocId(parsed.length ? parsed[0].id : null);

      const serverNodes = await docsApi.loadTree();
      setTree(serverNodes ? buildTree(serverNodes) : []);
    })();
  }, []);

  // ── Block operations ───────────────────────────────────────────────────────
  const addBlock = useCallback(async (type: BlockType) => {
    const base = { id: newId(), type, settings: {} } as DocBlock;
    let block: DocBlock;
    switch (type) {
      case 'heading':      block = { ...(base as HeadingBlock),      type: 'heading',      text: '' }; break;
      case 'text':         block = { ...(base as TextBlock),         type: 'text',         html: '' }; break;
      case 'divider':      block = { ...(base as DividerBlock),      type: 'divider' }; break;
      case 'image':        block = { ...(base as ImageBlock),        type: 'image',        url: '', caption: '' }; break;
      case 'video':        block = { ...(base as VideoBlock),        type: 'video',        url: '', caption: '' }; break;
      case 'bulletedList': block = { ...(base as BulletedListBlock), type: 'bulletedList', title: '', items: [''] }; break;
      case 'numberedList': block = { ...base, type: 'numberedList',  title: '', items: [''] } as DocBlock; break;
      case 'code':         block = { ...(base as CodeBlock),         type: 'code',         language: 'javascript', code: '' }; break;
      case 'quote':        block = { ...base, type: 'quote',         text: '', attribution: '' } as DocBlock; break;
      case 'callout':      block = { ...base, type: 'callout',       calloutType: 'info', text: '' } as DocBlock; break;
      case 'table':        block = { ...base, type: 'table',         headers: ['Column 1', 'Column 2'], rows: [['', '']] } as DocBlock; break;
      case 'toggle':       block = { ...base, type: 'toggle',        summary: '', content: '' } as DocBlock; break;
      case 'tabs':         block = { ...base, type: 'tabs',          tabs: [{ id: newId(), label: 'Tab 1', content: '' }, { id: newId(), label: 'Tab 2', content: '' }] } as DocBlock; break;
      default:             block = base;
    }

    if (!currentDoc) {
      // Doc not in local state yet — fetch it then append block
      if (currentDocId) {
        try {
          const fetched = await docsApi.getDoc(currentDocId);
          const parsedBlocks = typeof fetched.blocks === 'string'
            ? (() => { try { return JSON.parse(fetched.blocks as unknown as string); } catch { return []; } })()
            : Array.isArray(fetched.blocks) ? fetched.blocks : [];
          const updated = { ...fetched, id: currentDocId, blocks: [...parsedBlocks, block], updatedAt: new Date().toISOString() };
          setDocs((prev) => {
            const exists = prev.some((d) => d.id === currentDocId);
            return exists ? prev.map((d) => d.id === currentDocId ? updated : d) : [updated, ...prev];
          });
        } catch (err) {
          console.error('[useDocsBuilder] error fetching doc:', err);
        }
        return;
      }

      // No current doc at all — create one
      const parentId = selectedTreeId && findNode(tree, selectedTreeId)?.type === 'folder' ? selectedTreeId : null;
      const initialBlocks: DocBlock[] = [
        { id: newId(), type: 'heading', text: 'New Document', settings: { align: 'left' } } as HeadingBlock,
        block,
      ];
      const created = await docsApi.createDoc('Untitled', initialBlocks);
      setDocs((prev) => [created, ...prev]);
      const node = await docsApi.createDocNode(created.title, parentId, created.id);
      const localNode: DocRefNode = { id: node.id, type: 'doc', title: node.title, docId: created.id };
      setTree((prev) => insertChild(prev, parentId, localNode));
      setCurrentDocId(created.id);
      return;
    }

    setDocs((prev) => prev.map((d) =>
      d.id === currentDoc.id
        ? { ...d, blocks: [...(d.blocks ?? []), block], updatedAt: new Date().toISOString() }
        : d,
    ));
  }, [currentDoc, currentDocId, selectedTreeId, tree]);

  const updateBlock = useCallback(<T extends DocBlock>(id: string, patch: Partial<T>) => {
    if (!currentDoc) return;
    setDocs((prev) => prev.map((d) =>
      d.id === currentDoc.id
        ? { ...d, blocks: d.blocks.map((b) => b.id === id ? ({ ...b, ...patch } as DocBlock) : b), updatedAt: new Date().toISOString() }
        : d,
    ));
  }, [currentDoc]);

  const updateBlockSettings = useCallback((id: string, patch: Partial<BlockSettings>) => {
    if (!currentDoc) return;
    setDocs((prev) => prev.map((d) =>
      d.id === currentDoc.id
        ? { ...d, blocks: d.blocks.map((b) => b.id === id ? ({ ...b, settings: { ...b.settings, ...patch } } as DocBlock) : b), updatedAt: new Date().toISOString() }
        : d,
    ));
  }, [currentDoc]);

  const removeBlock = useCallback((id: string) => {
    if (!currentDoc) return;
    const updated: Doc = { ...currentDoc, blocks: currentDoc.blocks.filter((b: DocBlock) => b.id !== id), updatedAt: new Date().toISOString() };
    setDocs((prev) => prev.map((d) => d.id === currentDoc.id ? updated : d));
    docsApi.saveDoc(updated); // fire-and-forget
  }, [currentDoc]);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    if (!currentDoc) return;
    setDocs((prev) => prev.map((d) => {
      if (d.id !== currentDoc.id) return d;
      const idx = d.blocks.findIndex((b) => b.id === id);
      if (idx === -1) return d;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= d.blocks.length) return d;
      const copy = [...d.blocks];
      const [item] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, item);
      return { ...d, blocks: copy, updatedAt: new Date().toISOString() };
    }));
  }, [currentDoc]);

  // ── Drag-and-drop ──────────────────────────────────────────────────────────
  const dndHandlers = (blockId: string) => ({
    onDragStart: (e: React.DragEvent) => { setDragId(blockId); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver:  (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!currentDoc || dragId === null || dragId === blockId) return;
      const from = currentDoc.blocks.findIndex((b: DocBlock) => b.id === dragId);
      const to   = currentDoc.blocks.findIndex((b: DocBlock) => b.id === blockId);
      if (from === -1 || to === -1) return;
      setDocs((prev) => prev.map((d) => {
        if (d.id !== currentDoc.id) return d;
        const copy = [...d.blocks];
        const [item] = copy.splice(from, 1);
        copy.splice(to, 0, item);
        return { ...d, blocks: copy, updatedAt: new Date().toISOString() };
      }));
      setDragId(null);
    },
  });

  // ── Tree operations ────────────────────────────────────────────────────────
  const addFolder = async (parentId: string | null) => {
    const node = await docsApi.createFolder('New Folder', parentId);
    const folder: FolderNode = { id: node.id, type: 'folder', title: node.title, children: [] };
    setTree((prev) => insertChild(prev, parentId, folder));
    if (parentId) setExpanded((e) => ({ ...e, [parentId]: true }));
  };

  const addDocUnder = async (parentId: string | null) => {
    const initialBlocks: DocBlock[] = [
      { id: newId(), type: 'heading', text: 'New Document', settings: { align: 'left' } } as HeadingBlock,
    ];
    const created = await docsApi.createDoc('Untitled', initialBlocks);
    setDocs((prev) => [created, ...prev]);
    const node = await docsApi.createDocNode(created.title, parentId, created.id);
    const localNode: DocRefNode = { id: node.id, type: 'doc', title: node.title, docId: created.id };
    setTree((prev) => insertChild(prev, parentId, localNode));
    setCurrentDocId(created.id);
  };

  const renameNode = async (id: string, newTitle: string) => {
    const updated = await docsApi.renameNode(id, newTitle);
    setTree((prev) => mapTree(prev, (n) => n.id === id ? { ...n, title: updated.title } : n));
    const node = findNode(tree, id);
    if (node?.type === 'doc') {
      setDocs((prev) => prev.map((d) => d.id === node.docId ? { ...d, title: updated.title, updatedAt: new Date().toISOString() } : d));
    }
  };

  const deleteNodeAndDocs = async (id: string) => {
    let removedNode: TreeNode | null = null;
    setTree((prev) => {
      const { nodes: newTree, removed } = removeNode(prev, id);
      removedNode = removed ?? null;
      return newTree;
    });
    await docsApi.deleteNode(id);
    if (removedNode) {
      const docIds = collectDocIds(removedNode);
      if (docIds.length) {
        setDocs((prev) => prev.filter((d) => !docIds.includes(d.id)));
        if (currentDocId && docIds.includes(currentDocId)) setCurrentDocId(null);
      }
    }
  };

  const toggleExpand = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  // ── Doc-level operations ───────────────────────────────────────────────────
  const saveCurrentDoc = async () => {
    if (currentDoc) await docsApi.saveDoc(currentDoc);
  };

  const deleteDoc = async (docId: string) => {
    const allNodes = tree.flatMap((n) => n.type === 'folder' ? [n, ...n.children] : [n]);
    const nodeToDelete = allNodes.find((n) => n.type === 'doc' && n.docId === docId);
    if (nodeToDelete) {
      await deleteNodeAndDocs(nodeToDelete.id);
    } else {
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      if (currentDocId === docId) setCurrentDocId(null);
    }
  };

  const resetCurrent = () => {
    if (!currentDoc) return;
    setDocs((prev) => prev.map((d) => d.id === currentDoc.id ? { ...d, blocks: [], updatedAt: new Date().toISOString() } : d));
  };

  return {
    docs, currentDocId, setCurrentDocId, currentDoc,
    preview, setPreview,
    tree, selectedTreeId, setSelectedTreeId, expanded,
    addBlock, updateBlock, updateBlockSettings, removeBlock, moveBlock, dndHandlers,
    addFolder, addDocUnder, renameNode, deleteNodeAndDocs, deleteDoc,
    toggleExpand, saveCurrentDoc, resetCurrent,
  };
};
