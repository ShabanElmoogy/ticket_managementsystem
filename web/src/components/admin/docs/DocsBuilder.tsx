import React, { useState } from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import DocTreeSidebar from './components/DocTreeSidebar';
import RenameDialog from './components/RenameDialog';
import BlockPalette from './components/BlockPalette';
import DocsBuilderHeader from './components/DocsBuilderHeader';
import DocPreview from './components/DocPreview';
import DocEditor from './components/DocEditor';
import { useDocsBuilder } from './hooks/useDocsBuilder';

interface Props { onBackToGallery?: () => void; editingDocId?: string | null; }

const DocsBuilder: React.FC<Props> = ({ editingDocId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    currentDocId, setCurrentDocId, currentDoc,
    preview, setPreview, tree, selectedTreeId, setSelectedTreeId, expanded,
    addBlock, updateBlock, updateBlockSettings, removeBlock, moveBlock, dndHandlers,
    addFolder, addDocUnder, renameNode, deleteNodeAndDocs, toggleExpand, saveCurrentDoc,
  } = useDocsBuilder();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => { if (editingDocId) setCurrentDocId(editingDocId); }, [editingDocId, setCurrentDocId]);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', minHeight: 500 }}>

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

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: -1 }}>

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
            onSelectDoc={(docId, nodeId) => { setCurrentDocId(docId); setSelectedTreeId(nodeId); }}
            onSelectFolder={setSelectedTreeId}
            onToggleExpand={toggleExpand}
            onAddFolder={addFolder}
            onAddDoc={addDocUnder}
            onRenameRequest={(id, title) => setRenameTarget({ id, title })}
            onDelete={deleteNodeAndDocs}
          />
        )}

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {preview ? (
            <DocPreview blocks={blocks} />
          ) : (
            <DocEditor
              blocks={blocks}
              hasDoc={!!currentDoc}
              onUpdateBlock={updateBlock}
              onUpdateBlockSettings={updateBlockSettings}
              onRemoveBlock={removeBlock}
              onMoveBlock={moveBlock}
              dndHandlers={dndHandlers}
            />
          )}
        </Box>

        {!preview && (
          <BlockPalette
            onAdd={addBlock}
            sidebarBg={sidebarBg}
            sidebarBorder={sidebarBorder}
            hoverBg={hoverBg}
          />
        )}
      </Box>

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
