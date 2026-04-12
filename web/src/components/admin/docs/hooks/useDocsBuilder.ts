import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BlockType, BlockSettings, DocBlock, Doc, TreeNode, FolderNode, DocRefNode, HeadingBlock, TextBlock, DividerBlock, ImageBlock, VideoBlock, BulletedListBlock, CodeBlock } from '../types';
import { newId } from '../types';
import { saveDocServer, loadDocsServer, loadTreeServer, createFolderServer, createDocServer, createDocNodeServer, renameNodeServer, deleteNodeServer } from '../utils/serverUtils';
import { buildTree, findNode, insertChild, mapTree, removeNode, collectDocIds } from '../utils/treeUtils';

export const useDocsBuilder = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [preview, setPreview] = useState<boolean>(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);

  const currentDoc = useMemo(() => {
    const doc = docs.find((d) => d.id === currentDocId) || null;
    if (!doc) return null;
    if (typeof doc.blocks === 'string') {
      try { return { ...doc, blocks: JSON.parse(doc.blocks) }; }
      catch { return { ...doc, blocks: [] }; }
    }
    if (!Array.isArray(doc.blocks)) return { ...doc, blocks: [] };
    return doc;
  }, [docs, currentDocId]);

  // Initial load: fetch docs and tree from server
  useEffect(() => {
    (async () => {
      const serverDocs = await loadDocsServer();
      const rawDocs = Array.isArray(serverDocs) ? serverDocs : [];
      const docsArray = rawDocs.map((d: any) => ({
        ...d,
        blocks: typeof d.blocks === 'string'
          ? (() => { try { return JSON.parse(d.blocks); } catch { return []; } })()
          : Array.isArray(d.blocks) ? d.blocks : [],
      }));
      setDocs(docsArray);
      setCurrentDocId(docsArray.length ? docsArray[0].id : null);

      const serverNodes = await loadTreeServer();
      setTree(serverNodes ? buildTree(serverNodes) : []);
    })();
  }, []);

  // No localStorage persistence for docs. All saved via API.
  useEffect(() => {}, [docs]);

  // No localStorage persistence for tree. Load from API on mount.
  useEffect(() => {}, [tree]);

  const addBlock = useCallback(async (type: BlockType) => {
    const base = { id: newId(), type, settings: {} } as DocBlock;
    let block: DocBlock;
    switch (type) {
      case 'heading':
        block = { ...(base as HeadingBlock), type: 'heading', text: '' };
        break;
      case 'text':
        block = { ...(base as TextBlock), type: 'text', html: '' };
        break;
      case 'divider':
        block = { ...(base as DividerBlock), type: 'divider' };
        break;
      case 'image':
        block = { ...(base as ImageBlock), type: 'image', url: '', caption: '' };
        break;
      case 'video':
        block = { ...(base as VideoBlock), type: 'video', url: '', caption: '' };
        break;
      case 'bulletedList':
        block = { ...(base as BulletedListBlock), type: 'bulletedList', title: '', items: [''] };
        break;
      case 'code':
        block = { ...(base as CodeBlock), type: 'code', language: 'javascript', code: '' };
        break;
      default:
        block = base;
    }

    if (!currentDoc) {
      // currentDocId is set but doc not in local state — fetch it first
      if (currentDocId) {
        try {
          const { docsApi } = await import('../api/docs');
          const fetched = await docsApi.getDoc(currentDocId);
          console.log('[useDocsBuilder] fetched doc:', fetched);
          const parsed = {
            ...fetched,
            id: currentDocId, // explicitly enforce the ID
            blocks: typeof fetched.blocks === 'string'
              ? (() => { try { return JSON.parse(fetched.blocks as any); } catch { return []; } })()
              : Array.isArray(fetched.blocks) ? fetched.blocks : [],
            updatedAt: new Date().toISOString()
          };
          
          parsed.blocks = [...(parsed.blocks ?? []), block];
          setDocs((prev) => {
            const exists = prev.some(d => d.id === currentDocId);
            return exists ? prev.map(d => d.id === currentDocId ? parsed : d) : [parsed, ...prev];
          });
        } catch (err) { 
          console.error('[useDocsBuilder] error lazy-fetching doc:', err);
        }
        return; // UI will update with fetched doc + new block immediately
      }
      const parent = selectedTreeId ? findNode(tree, selectedTreeId) : null;
      const parentId = parent && parent.type === 'folder' ? parent.id : null;
      const initialBlocks: DocBlock[] = [
        { id: newId(), type: 'heading', text: 'New Document', settings: { align: 'left' } } as HeadingBlock,
        block,
      ];
      const created = await createDocServer('Untitled', initialBlocks);
      setDocs((prev) => [created, ...prev]);
      const node = await createDocNodeServer(created.title, parentId, created.id);
      const localNode: DocRefNode = { id: node.id, type: 'doc', title: node.title, docId: created.id };
      setTree((prev) => insertChild(prev, parentId, localNode));
      setCurrentDocId(created.id);
      return;
    }

    setDocs((prev) => prev.map((d) => (d.id === currentDoc.id ? { ...d, blocks: [...(d.blocks ?? []), block], updatedAt: new Date().toISOString() } : d)));
  }, [currentDoc, selectedTreeId, tree]);

  const updateBlock = useCallback(<T extends DocBlock>(id: string, patch: Partial<T>) => {
    if (!currentDoc) return;
    setDocs((prev) => prev.map((d) => (d.id === currentDoc.id ? { ...d, blocks: d.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as DocBlock) : b)), updatedAt: new Date().toISOString() } : d)));
  }, [currentDoc]);

  const updateBlockSettings = useCallback((id: string, patch: Partial<BlockSettings>) => {
    if (!currentDoc) return;
    setDocs((prev) => prev.map((d) => (d.id === currentDoc.id ? { ...d, blocks: d.blocks.map((b) => (b.id === id ? ({ ...b, settings: { ...b.settings, ...patch } }) as DocBlock : b)), updatedAt: new Date().toISOString() } : d)));
  }, [currentDoc]);

  const removeBlock = useCallback((id: string) => {
    if (!currentDoc) return;
    const newBlocks = currentDoc.blocks.filter((b) => b.id !== id);
    const updated: Doc = { ...currentDoc, blocks: newBlocks, updatedAt: new Date().toISOString() };
    setDocs((prev) => prev.map((d) => (d.id === currentDoc.id ? updated : d)));
    // persist to server (fire-and-forget)
    saveDocServer(updated);
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

  // DnD handlers
  const dndHandlers = (blockId: string) => ({
    onDragStart: (e: React.DragEvent) => {
      setDragId(blockId);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!currentDoc || dragId === null || dragId === blockId) return;
      const blocks = currentDoc.blocks;
      const from = blocks.findIndex((b) => b.id === dragId);
      const to = blocks.findIndex((b) => b.id === blockId);
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

  const addFolder = async (parentId: string | null) => {
    const node = await createFolderServer('New Folder', parentId);
    const folder: FolderNode = { id: node.id, type: 'folder', title: node.title, children: [] };
    setTree((prev) => insertChild(prev, parentId, folder));
    if (parentId) setExpanded((e) => ({ ...e, [parentId]: true }));
  };

  const addDocUnder = async (parentId: string | null) => {
    const initialBlocks: DocBlock[] = [
      { id: newId(), type: 'heading', text: 'New Document', settings: { align: 'left' } } as HeadingBlock,
    ];
    const created = await createDocServer('Untitled', initialBlocks);
    setDocs((prev) => [created, ...prev]);
    const node = await createDocNodeServer(created.title, parentId, created.id);
    const localNode: DocRefNode = { id: node.id, type: 'doc', title: node.title, docId: created.id };
    setTree((prev) => insertChild(prev, parentId, localNode));
    setCurrentDocId(created.id);
  };

  const renameNode = async (id: string, newTitle: string) => {
    const updated = await renameNodeServer(id, newTitle);
    setTree((prev) => mapTree(prev, (n) => (n.id === id ? { ...n, title: updated.title } : n)));
    // Mirror doc title in local state too
    const node = findNode(tree, id);
    if (node && node.type === 'doc') {
      setDocs((prev) => prev.map((d) => (d.id === node.docId ? { ...d, title: updated.title, updatedAt: new Date().toISOString() } : d)));
    }
  };

  const deleteNodeAndDocs = async (id: string) => {
    // Capture doc ids before deleting
    let removedNode: TreeNode | null = null;
    setTree((prev) => {
      const { nodes: newTree, removed } = removeNode(prev, id);
      removedNode = removed || null;
      return newTree; // optimistic UI; will persist below
    });
    await deleteNodeServer(id);
    if (removedNode) {
      const docIds = collectDocIds(removedNode);
      if (docIds.length) {
        setDocs((prevDocs) => prevDocs.filter((d) => !docIds.includes(d.id)));
        if (currentDocId && docIds.includes(currentDocId)) setCurrentDocId(null);
      }
    }
  };

  const toggleExpand = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  // Docs management

  const saveCurrentDoc = async () => {
    if (!currentDoc) return;
    const success = await saveDocServer(currentDoc);
    if (!success) {
      // already saved to localStorage via effect, do nothing else
    }
  };

  const deleteDoc = async (docId: string) => {
    // Find the node that references this doc
    const nodeToDelete = tree.flatMap(n => n.type === 'folder' ? [n, ...n.children] : [n]).find(n => n.type === 'doc' && n.docId === docId);
    if (nodeToDelete) {
      await deleteNodeAndDocs(nodeToDelete.id);
    } else {
      // If no node, just remove from docs (shouldn't happen)
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      if (currentDocId === docId) setCurrentDocId(null);
    }
  };

  const resetCurrent = () => {
    if (!currentDoc) return;
    setDocs((prev) => prev.map((d) => (d.id === currentDoc.id ? { ...d, blocks: [], updatedAt: new Date().toISOString() } : d)));
  };

  return {
    docs,
    currentDocId,
    setCurrentDocId,
    currentDoc,
    preview,
    setPreview,
    tree,
    selectedTreeId,
    setSelectedTreeId,
    expanded,
    addBlock,
    updateBlock,
    updateBlockSettings,
    removeBlock,
    moveBlock,
    dndHandlers,
    addFolder,
    addDocUnder,
    renameNode,
    deleteNodeAndDocs,
    deleteDoc,
    toggleExpand,
    saveCurrentDoc,
    resetCurrent,
  };
};