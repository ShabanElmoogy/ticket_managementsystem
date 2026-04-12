import React, { useState } from 'react';
import {
  Box, Typography, Button, IconButton, Tooltip,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Stack, Collapse, Divider, useTheme, alpha, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TitleIcon from '@mui/icons-material/Title';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import InfoIcon from '@mui/icons-material/Info';
import TableChartIcon from '@mui/icons-material/TableChart';
import CodeIcon from '@mui/icons-material/Code';
import NotesIcon from '@mui/icons-material/Notes';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import MenuIcon from '@mui/icons-material/Menu';
import MyGridHeader from '../../common/MyGridHeader';

import type { BlockType, TreeNode, HeadingBlock, TextBlock, BulletedListBlock, ImageBlock, VideoBlock, CodeBlock, QuoteBlock, CalloutBlock, TableBlock, ToggleBlock, NumberedListBlock } from './types';
import { findNode } from './utils/treeUtils';
import BlockContainer from './components/BlockContainer';
import BlockSettingsBar from './components/BlockSettingsBar';
import { HeadingBlockEditor, TextBlockEditor, CodeBlockEditor, BulletedListEditor, DividerBlockView, ImageBlockEditor, VideoBlockEditor } from './components/blockEditors';
import { NumberedListEditor, QuoteEditor, CalloutEditor, TableEditor, ToggleEditor } from './components/blockEditors';
import { useDocsBuilder } from './hooks/useDocsBuilder';

const PALETTE: { type: BlockType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'heading',      label: 'Heading',       icon: <TitleIcon sx={{ fontSize: 16 }} />,                color: '#f59e0b' },
  { type: 'text',         label: 'Text',          icon: <TextFieldsIcon sx={{ fontSize: 16 }} />,           color: '#3b82f6' },
  { type: 'quote',        label: 'Quote',         icon: <FormatQuoteIcon sx={{ fontSize: 16 }} />,          color: '#8b5cf6' },
  { type: 'callout',      label: 'Callout',       icon: <InfoIcon sx={{ fontSize: 16 }} />,                 color: '#06b6d4' },
  { type: 'code',         label: 'Code',          icon: <CodeIcon sx={{ fontSize: 16 }} />,                 color: '#6366f1' },
  { type: 'bulletedList', label: 'Bullet List',   icon: <FormatListBulletedIcon sx={{ fontSize: 16 }} />,   color: '#10b981' },
  { type: 'numberedList', label: 'Numbered List', icon: <FormatListNumberedIcon sx={{ fontSize: 16 }} />,   color: '#14b8a6' },
  { type: 'toggle',       label: 'Toggle',        icon: <ExpandMoreIcon sx={{ fontSize: 16 }} />,           color: '#f97316' },
  { type: 'table',        label: 'Table',         icon: <TableChartIcon sx={{ fontSize: 16 }} />,           color: '#ec4899' },
  { type: 'image',        label: 'Image',         icon: <ImageIcon sx={{ fontSize: 16 }} />,                color: '#0ea5e9' },
  { type: 'video',        label: 'Video',         icon: <MovieIcon sx={{ fontSize: 16 }} />,                color: '#ef4444' },
  { type: 'divider',      label: 'Divider',       icon: <HorizontalRuleIcon sx={{ fontSize: 16 }} />,       color: '#6b7280' },
];

// ── Rename dialog ─────────────────────────────────────────────────────────────
const RenameDialog: React.FC<{ open: boolean; initial: string; onClose: () => void; onConfirm: (v: string) => void }> = ({ open, initial, onClose, onConfirm }) => {
  const [val, setVal] = React.useState(initial);
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (open) { setVal(initial); setTimeout(() => ref.current?.focus(), 80); } }, [open, initial]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Rename</DialogTitle>
      <DialogContent>
        <TextField inputRef={ref} fullWidth size="small" value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onConfirm(val.trim()); onClose(); } }}
          sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button variant="contained" size="small" disabled={!val.trim()} onClick={() => { onConfirm(val.trim()); onClose(); }}>Rename</Button>
      </DialogActions>
    </Dialog>
  );
};

interface DocsBuilderProps { onBackToGallery?: () => void; editingDocId?: string | null; }

const DocsBuilder: React.FC<DocsBuilderProps> = ({ editingDocId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    docs, currentDocId, setCurrentDocId, currentDoc,
    preview, setPreview, tree, selectedTreeId, setSelectedTreeId, expanded,
    addBlock, updateBlock, updateBlockSettings, removeBlock, moveBlock, dndHandlers,
    addFolder, addDocUnder, renameNode, deleteNodeAndDocs, toggleExpand, saveCurrentDoc, resetCurrent,
    selectDoc,
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

  // ── Sidebar colors ────────────────────────────────────────────────────────
  const sidebarBg = isDark ? '#0f172a' : '#f8fafc';
  const sidebarBorder = isDark ? '#1e293b' : '#e2e8f0';
  const hoverBg = isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04);
  const selectedBg = isDark ? alpha('#3b82f6', 0.15) : alpha('#3b82f6', 0.08);

  // ── Tree renderer ─────────────────────────────────────────────────────────
  const renderTree = (nodes: TreeNode[], depth = 0): React.ReactNode =>
    nodes.map((node) => {
      if (node.type === 'folder') {
        const open = !!expanded[node.id];
        return (
          <Box key={node.id}>
            <ListItem disablePadding sx={{ '&:hover .tree-actions': { opacity: 1 } }}>
              <ListItemButton
                onClick={() => { toggleExpand(node.id); setSelectedTreeId(node.id); }}
                sx={{ pl: 1.5 + depth * 1.5, py: 0.5, borderRadius: 1, mx: 0.5, '&:hover': { bgcolor: hoverBg } }}
              >
                <ListItemIcon sx={{ minWidth: 24 }}>
                  {open ? <FolderOpenIcon sx={{ fontSize: 15, color: '#f59e0b' }} /> : <FolderIcon sx={{ fontSize: 15, color: '#f59e0b' }} />}
                </ListItemIcon>
                <ListItemText primary={node.title} primaryTypographyProps={{ variant: 'body2', fontWeight: 500, fontSize: '0.8rem', noWrap: true }} />
                {open ? <ExpandLessIcon sx={{ fontSize: 14, opacity: 0.5 }} /> : <ExpandMoreIcon sx={{ fontSize: 14, opacity: 0.5 }} />}
              </ListItemButton>
              <Stack className="tree-actions" direction="row" sx={{ position: 'absolute', right: 8, opacity: 0, transition: 'opacity 0.15s', bgcolor: sidebarBg, borderRadius: 1 }}>
                <Tooltip title="Add doc"><IconButton size="small" sx={{ p: 0.25 }} onClick={() => addDocUnder(node.id)}><AddIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
                <Tooltip title="Rename"><IconButton size="small" sx={{ p: 0.25 }} onClick={() => setRenameTarget({ id: node.id, title: node.title })}><DriveFileRenameOutlineIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" sx={{ p: 0.25 }} color="error" onClick={() => deleteNodeAndDocs(node.id)}><DeleteIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
              </Stack>
            </ListItem>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List dense disablePadding>{renderTree(node.children, depth + 1)}</List>
            </Collapse>
          </Box>
        );
      }
      const isSelected = currentDocId === node.docId;
      return (
        <ListItem key={node.id} disablePadding sx={{ '&:hover .tree-actions': { opacity: 1 } }}>
          <ListItemButton
            selected={isSelected}
            onClick={() => selectDoc ? selectDoc(node.docId, node.id) : (setCurrentDocId(node.docId), setSelectedTreeId(node.id))}
            sx={{
              pl: 2 + depth * 1.5, py: 0.5, borderRadius: 1, mx: 0.5,
              '&:hover': { bgcolor: hoverBg },
              '&.Mui-selected': { bgcolor: selectedBg, '&:hover': { bgcolor: selectedBg } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 22 }}>
              <DescriptionIcon sx={{ fontSize: 14, color: isSelected ? 'primary.main' : 'text.disabled' }} />
            </ListItemIcon>
            <ListItemText primary={node.title} primaryTypographyProps={{ variant: 'body2', fontSize: '0.8rem', noWrap: true, color: isSelected ? 'primary.main' : 'text.primary', fontWeight: isSelected ? 600 : 400 }} />
          </ListItemButton>
          <Stack className="tree-actions" direction="row" sx={{ position: 'absolute', right: 8, opacity: 0, transition: 'opacity 0.15s', bgcolor: sidebarBg, borderRadius: 1 }}>
            <Tooltip title="Rename"><IconButton size="small" sx={{ p: 0.25 }} onClick={() => setRenameTarget({ id: node.id, title: node.title })}><DriveFileRenameOutlineIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" sx={{ p: 0.25 }} color="error" onClick={() => deleteNodeAndDocs(node.id)}><DeleteIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
          </Stack>
        </ListItem>
      );
    });

  // ── Block renderer (preview) ──────────────────────────────────────────────
  const renderPreviewBlock = (block: any) => {
    switch (block.type) {
      case 'heading': return <Typography variant="h4" sx={{ fontWeight: 700, textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit' }}>{(block as HeadingBlock).text}</Typography>;
      case 'text': return <Typography component="div" sx={{ whiteSpace: 'pre-wrap', textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: (block as TextBlock).html }} />;
      case 'code': return (
        <Box>
          <Chip label={(block as CodeBlock).language} size="small" sx={{ mb: 1, fontSize: '0.65rem', height: 20 }} />
          <SyntaxHighlighter language={(block as CodeBlock).language} style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: 8, fontSize: '0.85rem' }}>{(block as CodeBlock).code}</SyntaxHighlighter>
        </Box>
      );
      case 'bulletedList': return (
        <Box sx={{ color: block.settings?.color || 'inherit' }}>
          {(block as BulletedListBlock).title && <Typography variant="h6" fontWeight={600} mb={1}>{(block as BulletedListBlock).title}</Typography>}
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>{(block as BulletedListBlock).items.filter(Boolean).map((it: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{it}</li>)}</ul>
        </Box>
      );
      case 'numberedList': return (
        <Box sx={{ color: block.settings?.color || 'inherit' }}>
          {(block as NumberedListBlock).title && <Typography variant="h6" fontWeight={600} mb={1}>{(block as NumberedListBlock).title}</Typography>}
          <ol style={{ marginTop: 0, paddingLeft: 20 }}>{(block as NumberedListBlock).items.filter(Boolean).map((it: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{it}</li>)}</ol>
        </Box>
      );
      case 'quote': return (
        <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, py: 0.5 }}>
          <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.7 }}>{(block as QuoteBlock).text}</Typography>
          {(block as QuoteBlock).attribution && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>— {(block as QuoteBlock).attribution}</Typography>}
        </Box>
      );
      case 'callout': {
        const COLORS: Record<string, string> = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444' };
        const c = COLORS[(block as CalloutBlock).calloutType] ?? '#3b82f6';
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
                {tb.rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{cell}</td>)}</tr>)}
              </tbody>
            </table>
          </Box>
        );
      }
      case 'toggle': return (
        <details style={{ cursor: 'pointer' }}>
          <summary style={{ fontWeight: 600, padding: '4px 0', userSelect: 'none' }}>{(block as ToggleBlock).summary || 'Toggle'}</summary>
          <Box sx={{ pl: 2, pt: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{(block as ToggleBlock).content}</Typography>
          </Box>
        </details>
      );
      case 'divider': return <Divider sx={{ borderColor: block.settings?.dividerColor, borderBottomWidth: block.settings?.dividerThickness || 1 }} />;
      case 'image': return (block as ImageBlock).url ? (
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
                  ? <iframe title={vb.caption || 'video'} src={embedSrc} width="100%" height="100%" frameBorder={0} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
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

  const blocks = currentDoc?.blocks ?? [];

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
                <Button size="small" variant="contained" startIcon={saved ? <CheckIcon /> : <SaveIcon />}
                  onClick={handleSave} disabled={!currentDoc}
                  color={saved ? 'success' : 'primary'}>
                  {saved ? 'Saved' : 'Save'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        }
      />

      {/* ── Body ── */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 0.5 }}>

        {/* ── Left sidebar: tree ── */}
        {sidebarOpen && (
          <Box sx={{
            width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
            bgcolor: sidebarBg, borderRight: `1px solid ${sidebarBorder}`, overflow: 'hidden',
          }}>
            {/* Sidebar header */}
            <Box sx={{ px: 1.5, py: 1.25, borderBottom: `1px solid ${sidebarBorder}`, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <NotesIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} sx={{ flex: 1 }}>
                Documents
              </Typography>
              <Tooltip title="New folder">
                <IconButton size="small" sx={{ p: 0.25 }} onClick={() => addFolder(null)}><CreateNewFolderIcon sx={{ fontSize: 14 }} /></IconButton>
              </Tooltip>
              <Tooltip title="New document">
                <IconButton size="small" sx={{ p: 0.25 }} onClick={() => addDocUnder(selectedTreeId && findNode(tree, selectedTreeId)?.type === 'folder' ? selectedTreeId : null)}>
                  <AddIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Tree */}
            <Box sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
              {tree.length === 0 ? (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.disabled">No documents yet</Typography>
                  <Box mt={1}>
                    <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addDocUnder(null)} sx={{ fontSize: '0.7rem' }}>
                      New Doc
                    </Button>
                  </Box>
                </Box>
              ) : (
                <List dense disablePadding>{renderTree(tree)}</List>
              )}
            </Box>
          </Box>
        )}

        {/* ── Center: editor / preview ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {preview ? (
            /* Preview */
            <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
              <Box sx={{ maxWidth: 720, mx: 'auto' }}>
                {blocks.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" mt={6}>Nothing to preview yet.</Typography>
                ) : (
                  blocks.map((block) => (
                    <Box key={block.id} sx={{ mb: 3 }}>{renderPreviewBlock(block)}</Box>
                  ))
                )}
              </Box>
            </Box>
          ) : (
            /* Editor */
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
                  blocks.map((block, idx) => {
                    const actions = {
                      onMoveUp:   idx > 0              ? () => moveBlock(block.id, -1) : undefined,
                      onMoveDown: idx < blocks.length - 1 ? () => moveBlock(block.id, 1)  : undefined,
                      onDelete:   () => removeBlock(block.id),
                    };
                    const dnd = dndHandlers(block.id);
                    const settings = block.settings || {};
                    const onChange = (p: any) => updateBlock(block.id, p);
                    const onSC = (p: any) => updateBlockSettings(block.id, p);
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
                      case 'divider':     return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><DividerBlockView settings={settings} /><BlockSettingsBar settings={settings} onSettingsChange={onSC} enableDivider /></BlockContainer>;
                      case 'image':       return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><ImageBlockEditor block={block as ImageBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
                      case 'video':       return <BlockContainer key={block.id} {...actions} draggable dragHandlers={dnd}><VideoBlockEditor block={block as VideoBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
                      default: return null;
                    }
                  })
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* ── Right sidebar: block palette ── */}
        {!preview && (
          <Box sx={{
            width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column',
            bgcolor: sidebarBg, borderLeft: `1px solid ${sidebarBorder}`, overflow: 'hidden',
          }}>
            <Box sx={{ px: 1.5, py: 1.25, borderBottom: `1px solid ${sidebarBorder}` }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                Blocks
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
              {PALETTE.map((p) => (
                <Box
                  key={p.type}
                  onClick={() => addBlock(p.type)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.25,
                    px: 1.5, py: 0.75, mx: 0.5, borderRadius: 1, cursor: 'pointer',
                    '&:hover': { bgcolor: hoverBg },
                    transition: 'background 0.1s',
                  }}
                >
                  <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: alpha(p.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: p.color }}>
                    {p.icon}
                  </Box>
                  <Typography variant="body2" fontSize="0.78rem" fontWeight={500}>{p.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Rename dialog ── */}
      <RenameDialog
        open={!!renameTarget}
        initial={renameTarget?.title ?? ''}
        onClose={() => setRenameTarget(null)}
        onConfirm={(title) => { if (renameTarget) renameNode(renameTarget.id, title); }}
      />
    </Box>
  );
};

export default DocsBuilder;
