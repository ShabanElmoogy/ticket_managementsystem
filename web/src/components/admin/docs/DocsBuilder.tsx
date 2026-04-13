import React, { useState } from 'react';
import {
  Box, Typography, Button, IconButton, Tooltip,
  Divider, useTheme, alpha, Chip,
} from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import MenuIcon from '@mui/icons-material/Menu';
import NotesIcon from '@mui/icons-material/Notes';
import MyGridHeader from '../../common/MyGridHeader';

import type {
  DocBlock, HeadingBlock, TextBlock, BulletedListBlock, NumberedListBlock,
  ImageBlock, VideoBlock, CodeBlock, QuoteBlock, CalloutBlock, TableBlock,
  ToggleBlock, TabsBlock,
} from './types';
import BlockContainer from './components/BlockContainer';
import BlockSettingsBar from './components/BlockSettingsBar';
import BlockPalette from './components/BlockPalette';
import DocTreeSidebar from './components/DocTreeSidebar';
import RenameDialog from './components/RenameDialog';
import TabsPreview from './components/TabsPreview';
import {
  HeadingBlockEditor, TextBlockEditor, CodeBlockEditor, BulletedListEditor,
  NumberedListEditor, DividerBlockView, ImageBlockEditor, VideoBlockEditor,
  QuoteEditor, CalloutEditor, TableEditor, ToggleEditor, TabsEditor,
} from './components/blockEditors';
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

  // Theme-aware sidebar colors
  const sidebarBg     = isDark ? '#0f172a' : '#f8fafc';
  const sidebarBorder = isDark ? '#1e293b' : '#e2e8f0';
  const hoverBg       = isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04);
  const selectedBg    = isDark ? alpha('#3b82f6', 0.15) : alpha('#3b82f6', 0.08);

  const blocks = currentDoc?.blocks ?? [];

  // ── Preview renderer ────────────────────────────────────────────────────────
  const renderPreviewBlock = (block: DocBlock): React.ReactNode => {
    switch (block.type) {
      case 'heading':
        return <Typography variant="h4" sx={{ fontWeight: 700, textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit' }}>{(block as HeadingBlock).text}</Typography>;

      case 'text':
        return <Typography component="div" sx={{ whiteSpace: 'pre-wrap', textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: (block as TextBlock).html }} />;

      case 'code':
        return (
          <Box>
            <Chip label={(block as CodeBlock).language} size="small" sx={{ mb: 1, fontSize: '0.65rem', height: 20 }} />
            <SyntaxHighlighter language={(block as CodeBlock).language} style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: 8, fontSize: '0.85rem' }}>
              {(block as CodeBlock).code}
            </SyntaxHighlighter>
          </Box>
        );

      case 'bulletedList':
        return (
          <Box sx={{ color: block.settings?.color || 'inherit' }}>
            {(block as BulletedListBlock).title && <Typography variant="h6" fontWeight={600} mb={1}>{(block as BulletedListBlock).title}</Typography>}
            <ul style={{ marginTop: 0, paddingLeft: 20 }}>
              {(block as BulletedListBlock).items.filter(Boolean).map((it, i) => <li key={i} style={{ marginBottom: 4 }}>{it}</li>)}
            </ul>
          </Box>
        );

      case 'numberedList':
        return (
          <Box sx={{ color: block.settings?.color || 'inherit' }}>
            {(block as NumberedListBlock).title && <Typography variant="h6" fontWeight={600} mb={1}>{(block as NumberedListBlock).title}</Typography>}
            <ol style={{ marginTop: 0, paddingLeft: 20 }}>
              {(block as NumberedListBlock).items.filter(Boolean).map((it, i) => <li key={i} style={{ marginBottom: 4 }}>{it}</li>)}
            </ol>
          </Box>
        );

      case 'quote':
        return (
          <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, py: 0.5 }}>
            <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.7 }}>{(block as QuoteBlock).text}</Typography>
            {(block as QuoteBlock).attribution && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>— {(block as QuoteBlock).attribution}</Typography>}
          </Box>
        );

      case 'callout': {
        const CALLOUT_COLORS: Record<string, string> = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444' };
        const c = CALLOUT_COLORS[(block as CalloutBlock).calloutType] ?? '#3b82f6';
        return (
          <Box sx={{ borderLeft: `4px solid ${c}`, bgcolor: `${c}0d`, borderRadius: 1, p: 1.5 }}>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{(block as CalloutBlock).text}</Typography>
          </Box>
        );
      }

      case 'table': {
        const tb = block as TableBlock;
        return (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>{tb.headers.map((h, i) => <th key={i} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid', fontWeight: 600, background: 'rgba(0,0,0,0.04)' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {tb.rows.map((row, r) => (
                  <tr key={r}>{row.map((cell, c) => <td key={c} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </Box>
        );
      }

      case 'toggle':
        return (
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontWeight: 600, padding: '4px 0', userSelect: 'none' }}>{(block as ToggleBlock).summary || 'Toggle'}</summary>
            <Box sx={{ pl: 2, pt: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{(block as ToggleBlock).content}</Typography>
            </Box>
          </details>
        );

      case 'tabs':
        return <TabsPreview tabs={(block as TabsBlock).tabs ?? []} />;

      case 'divider':
        return <Divider sx={{ borderColor: block.settings?.dividerColor, borderBottomWidth: block.settings?.dividerThickness || 1 }} />;

      case 'image':
        return (block as ImageBlock).url ? (
          <Box sx={{ textAlign: block.settings?.align || 'center' }}>
            <img src={(block as ImageBlock).url} alt={(block as ImageBlock).caption || ''} style={{ maxWidth: '100%', borderRadius: 8 }} />
            {(block as ImageBlock).caption && <Typography variant="caption" display="block" mt={1} color="text.secondary">{(block as ImageBlock).caption}</Typography>}
          </Box>
        ) : null;

      case 'video': {
        const vb = block as VideoBlock;
        if (!vb.url) return null;
        const isYT = /youtu\.be|youtube\.com/.test(vb.url);
        const embedSrc = (() => {
          if (!isYT) return null;
          try {
            const u = new URL(vb.url);
            const v = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean)[0];
            return v ? `https://www.youtube.com/embed/${v}` : null;
          } catch { return null; }
        })();
        return (
          <Box>
            <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
              <Box sx={{ position: 'absolute', inset: 0 }}>
                {isYT && embedSrc
                  ? <iframe title={vb.caption || 'video'} src={embedSrc} width="100%" height="100%" style={{ border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  : <video src={vb.url} controls style={{ width: '100%', height: '100%' }} />
                }
              </Box>
            </Box>
            {vb.caption && <Typography variant="caption" display="block" mt={1} color="text.secondary">{vb.caption}</Typography>}
          </Box>
        );
      }

      default: return null;
    }
  };

  // ── Editor block renderer ───────────────────────────────────────────────────
  const renderEditorBlock = (block: DocBlock, idx: number): React.ReactNode => {
    const actions = {
      onMoveUp:   idx > 0              ? () => moveBlock(block.id, -1) : undefined,
      onMoveDown: idx < blocks.length - 1 ? () => moveBlock(block.id, 1)  : undefined,
      onDelete:   () => removeBlock(block.id),
    };
    const dnd      = dndHandlers(block.id);
    const settings = block.settings || {};
    const onChange = (p: Partial<DocBlock>) => updateBlock(block.id, p);
    const onSC     = (p: any) => updateBlockSettings(block.id, p);

    switch (block.type) {
      case 'heading':     return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><HeadingBlockEditor block={block as HeadingBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'text':        return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><TextBlockEditor block={block as TextBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'code':        return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><CodeBlockEditor block={block as CodeBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'bulletedList':return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><BulletedListEditor block={block as BulletedListBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'numberedList':return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><NumberedListEditor block={block as NumberedListBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'quote':       return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><QuoteEditor block={block as QuoteBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'callout':     return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><CalloutEditor block={block as CalloutBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'table':       return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><TableEditor block={block as TableBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'toggle':      return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><ToggleEditor block={block as ToggleBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'tabs':        return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><TabsEditor block={block as TabsBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'divider':     return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><DividerBlockView settings={settings} /><BlockSettingsBar settings={settings} onSettingsChange={onSC} enableDivider /></BlockContainer>;
      case 'image':       return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><ImageBlockEditor block={block as ImageBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'video':       return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><VideoBlockEditor block={block as VideoBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      default: return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', minHeight: 500 }}>

      {/* ── Header ── */}
      <MyGridHeader
        title={currentDoc?.title || 'Documentation Builder'}
        icon={TextFieldsIcon}
        rightActions={
          <Box display="flex" gap={1} alignItems="center">
            <Tooltip title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
              <IconButton size="small" onClick={() => setSidebarOpen(v => !v)}><MenuIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Button size="small" variant="outlined" startIcon={preview ? <EditIcon /> : <VisibilityIcon />} onClick={() => setPreview(p => !p)}>
              {preview ? 'Edit' : 'Preview'}
            </Button>
            <Tooltip title="Save">
              <span>
                <Button size="small" variant="contained" color={saved ? 'success' : 'primary'}
                  startIcon={saved ? <CheckIcon /> : <SaveIcon />}
                  onClick={handleSave} disabled={!currentDoc}>
                  {saved ? 'Saved' : 'Save'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        }
      />

      {/* ── Body ── */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2,mt:-1 }}>

        {/* Left: document tree */}
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

        {/* Center: editor / preview */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {preview ? (
            <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
              <Box sx={{ maxWidth: 720, mx: 'auto' }}>
                {blocks.length === 0
                  ? <Typography color="text.secondary" textAlign="center" mt={6}>Nothing to preview yet.</Typography>
                  : blocks.map((block: DocBlock) => <Box key={block.id} sx={{ mb: 3 }}>{renderPreviewBlock(block)}</Box>)
                }
              </Box>
            </Box>
          ) : (
            <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, md: 3 } }}>
              <Box sx={{ maxWidth: 760, mx: 'auto' }}>
                {!currentDoc ? (
                  <Box sx={{ textAlign: 'center', mt: 8 }}>
                    <NotesIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight={400}>Select a document to start editing</Typography>
                    <Typography variant="body2" color="text.disabled" mt={0.5}>or create a new one from the sidebar</Typography>
                  </Box>
                ) : blocks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', mt: 6 }}>
                    <Typography variant="body1" color="text.secondary">This document is empty.</Typography>
                    <Typography variant="body2" color="text.disabled" mt={0.5}>Click a block type on the right to add content.</Typography>
                  </Box>
                ) : (
                  blocks.map((block: DocBlock, idx: number) => renderEditorBlock(block, idx))
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Right: block palette */}
        {!preview && (
          <BlockPalette
            onAdd={addBlock}
            sidebarBg={sidebarBg}
            sidebarBorder={sidebarBorder}
            hoverBg={hoverBg}
          />
        )}
      </Box>

      {/* Rename dialog */}
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
