import React, { useEffect, useState } from 'react';
import { Box, useTheme, useMediaQuery, alpha } from '@mui/material';
import DocTreeSidebar from './components/DocTreeSidebar';
import BlockPalette from './components/BlockPalette';
import DocsBuilderHeader from './components/DocsBuilderHeader';
import DocPreview from './components/DocPreview';
import DocEditor from './components/DocEditor';
import { useDocsStore, useCurrentDoc } from './hooks/useDocsStore';

interface Props { onBackToGallery?: () => void; editingDocId?: string | null; }

const COMPACT_QUERY = '(max-width: 900px)';

const DocsBuilder: React.FC<Props> = ({ editingDocId }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const compact = useMediaQuery(COMPACT_QUERY);

  const currentDocId    = useDocsStore((s) => s.currentDocId);
  const setCurrentDocId = useDocsStore((s) => s.setCurrentDocId);
  const preview         = useDocsStore((s) => s.preview);
  const setPreview      = useDocsStore((s) => s.setPreview);
  const tree            = useDocsStore((s) => s.tree);
  const selectedTreeId  = useDocsStore((s) => s.selectedTreeId);
  const setSelectedTreeId = useDocsStore((s) => s.setSelectedTreeId);
  const expanded        = useDocsStore((s) => s.expanded);
  const addBlock        = useDocsStore((s) => s.addBlock);
  const updateBlock     = useDocsStore((s) => s.updateBlock);
  const updateBlockSettings = useDocsStore((s) => s.updateBlockSettings);
  const removeBlock     = useDocsStore((s) => s.removeBlock);
  const moveBlock       = useDocsStore((s) => s.moveBlock);
  const setDragId       = useDocsStore((s) => s.setDragId);
  const dropBlock       = useDocsStore((s) => s.dropBlock);
  const addFolder       = useDocsStore((s) => s.addFolder);
  const addDocUnder     = useDocsStore((s) => s.addDocUnder);
  const renameNode      = useDocsStore((s) => s.renameNode);
  const deleteNodeAndDocs = useDocsStore((s) => s.deleteNodeAndDocs);
  const toggleExpand    = useDocsStore((s) => s.toggleExpand);
  const setFolderIcon   = useDocsStore((s) => s.setFolderIcon);
  const saveCurrentDoc    = useDocsStore((s) => s.saveCurrentDoc);
  const renameCurrentDoc  = useDocsStore((s) => s.renameCurrentDoc);
  const saveStatus        = useDocsStore((s) => s.saveStatus);
  const setSaveStatus     = useDocsStore((s) => s.setSaveStatus);
  const currentDoc      = useCurrentDoc();

  // dndHandlers now built inline using store actions
  const dndHandlers = (blockId: string) => ({
    onDragStart: (e: React.DragEvent) => { setDragId(blockId); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver:  (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    onDrop:      (e: React.DragEvent) => { e.preventDefault(); dropBlock(blockId); },
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { if (compact) setSidebarOpen(false); }, [compact]);
  useEffect(() => { if (editingDocId) { setCurrentDocId(editingDocId); setPreview(false); } }, [editingDocId, setCurrentDocId, setPreview]);

  const handleSave = async () => {
    await saveCurrentDoc();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const sidebarBg     = isDark ? '#0f172a' : '#f8fafc';
  const sidebarBorder = isDark ? '#1e293b' : '#e2e8f0';
  const hoverBg       = isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04);
  const selectedBg    = isDark ? alpha('#3b82f6', 0.15) : alpha('#3b82f6', 0.08);

  const blocks = currentDoc?.blocks ?? [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', minHeight: 400 }}>

      <DocsBuilderHeader
        title={currentDoc?.title || 'Documentation Builder'}
        preview={preview}
        saveStatus={saveStatus}
        hasDoc={!!currentDoc}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        onTogglePreview={() => setPreview(!preview)}
        onSave={handleSave}
        onRenameTitle={renameCurrentDoc}
      />

      {/* ── Main body ── */}
      <Box sx={{ position: 'relative', display: 'flex', flex: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: -1 }}>

        {/* Doc tree sidebar
            compact  → position:absolute, overlays editor, zero flex space
            desktop  → position:relative, normal flex item */}
        {sidebarOpen && (
          <DocTreeSidebar
            tree={tree}
            docs={[]}
            currentDocId={currentDocId}
            selectedTreeId={selectedTreeId}
            expanded={expanded}
            sidebarBg={sidebarBg}
            sidebarBorder={sidebarBorder}
            hoverBg={hoverBg}
            selectedBg={selectedBg}
            overlay={compact}
            onSelectDoc={(docId, nodeId) => {
              setCurrentDocId(docId);
              setSelectedTreeId(nodeId);
              if (compact) setSidebarOpen(false);
            }}
            onSelectFolder={setSelectedTreeId}
            onToggleExpand={toggleExpand}
            onAddFolder={addFolder}
            onAddDoc={addDocUnder}
            onRenameRequest={(id, title) => renameNode(id, title)}
            onDelete={deleteNodeAndDocs}
            onSetFolderIcon={setFolderIcon}
          />
        )}

        {/* Backdrop — closes overlay sidebar on tap */}
        {sidebarOpen && compact && (
          <Box
            onClick={() => setSidebarOpen(false)}
            sx={{ position: 'absolute', inset: 0, zIndex: 9, bgcolor: 'rgba(0,0,0,0.35)' }}
          />
        )}

        {/* Editor / Preview — always flex:1, never shrinks */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {preview
            ? <DocPreview blocks={blocks} />
            : <DocEditor
                blocks={blocks}
                hasDoc={!!currentDoc}
                onUpdateBlock={updateBlock}
                onUpdateBlockSettings={updateBlockSettings}
                onRemoveBlock={removeBlock}
                onMoveBlock={moveBlock}
                dndHandlers={dndHandlers}
              />
          }
        </Box>

        {/* Block palette — side column on desktop only */}
        {!preview && !compact && (
          <BlockPalette
            onAdd={addBlock}
            sidebarBg={sidebarBg}
            sidebarBorder={sidebarBorder}
            hoverBg={hoverBg}
          />
        )}
      </Box>

      {/* Block palette — horizontal strip on compact screens */}
      {!preview && compact && (
        <Box sx={{
          display: 'flex',
          overflowX: 'auto',
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: sidebarBg,
        }}>
          <BlockPalette
            onAdd={addBlock}
            sidebarBg={sidebarBg}
            sidebarBorder={sidebarBorder}
            hoverBg={hoverBg}
            horizontal
          />
        </Box>
      )}

    </Box>
  );
};

export default DocsBuilder;
