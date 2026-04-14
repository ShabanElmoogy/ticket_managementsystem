import React, { useEffect, useState } from 'react';
import { Box, useTheme, useMediaQuery, alpha } from '@mui/material';
import DocTreeSidebar from './components/DocTreeSidebar';
import RenameDialog from './components/RenameDialog';
import BlockPalette from './components/BlockPalette';
import DocsBuilderHeader from './components/DocsBuilderHeader';
import DocPreview from './components/DocPreview';
import DocEditor from './components/DocEditor';
import { useDocsContext } from './hooks/DocsContext';

interface Props { onBackToGallery?: () => void; editingDocId?: string | null; }

// Breakpoint at which the 3-column layout collapses.
// 900px accounts for the 240px admin sidebar leaving ~660px — not enough for 3 columns.
const COMPACT_QUERY = '(max-width: 900px)';

const DocsBuilder: React.FC<Props> = ({ editingDocId }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const compact = useMediaQuery(COMPACT_QUERY);

  const {
    currentDocId, setCurrentDocId, currentDoc,
    preview, setPreview, tree, selectedTreeId, setSelectedTreeId, expanded,
    addBlock, updateBlock, updateBlockSettings, removeBlock, moveBlock, dndHandlers,
    addFolder, addDocUnder, renameNode, deleteNodeAndDocs, toggleExpand, saveCurrentDoc,
  } = useDocsContext();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [saved, setSaved] = useState(false);

  // Keep sidebar closed whenever we're in compact mode
  useEffect(() => { if (compact) setSidebarOpen(false); }, [compact]);

  useEffect(() => { if (editingDocId) setCurrentDocId(editingDocId); }, [editingDocId, setCurrentDocId]);

  const handleSave = async () => {
    await saveCurrentDoc();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        saved={saved}
        hasDoc={!!currentDoc}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        onTogglePreview={() => setPreview(p => !p)}
        onSave={handleSave}
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
            onRenameRequest={(id, title) => setRenameTarget({ id, title })}
            onDelete={deleteNodeAndDocs}
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

      <RenameDialog
        open={!!renameTarget}
        initial={renameTarget?.title ?? ''}
        onClose={() => setRenameTarget(null)}
        onConfirm={title => { if (renameTarget) renameNode(renameTarget.id, title); }}
      />
    </Box>
  );
};

export default DocsBuilder;
