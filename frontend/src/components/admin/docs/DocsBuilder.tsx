import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
  Button,
  IconButton,
  TextField,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Stack,
  Collapse,
} from '@mui/material';
import TitleIcon from '@mui/icons-material/Title';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import NotesIcon from '@mui/icons-material/Notes';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import MyGridHeader from '../../common/MyGridHeader';

// Types
export type BlockType = 'heading' | 'text' | 'divider' | 'image' | 'video' | 'bulletedList';

export interface BlockSettings {
  align?: 'left' | 'center' | 'right';
  color?: string; // text color
  dividerColor?: string;
  dividerThickness?: number; // px
}

export interface DocBlockBase {
  id: string;
  type: BlockType;
  settings?: BlockSettings;
}

export interface HeadingBlock extends DocBlockBase {
  type: 'heading';
  text: string; // plain text
}

export interface TextBlock extends DocBlockBase {
  type: 'text';
  html: string; // rich text HTML content
}

export interface DividerBlock extends DocBlockBase {
  type: 'divider';
}

export interface ImageBlock extends DocBlockBase {
  type: 'image';
  url: string;
  caption?: string;
}

export interface VideoBlock extends DocBlockBase {
  type: 'video';
  url: string;
  caption?: string;
}

export interface BulletedListBlock extends DocBlockBase {
  type: 'bulletedList';
  title?: string;
  items: string[];
}

export type DocBlock = HeadingBlock | TextBlock | DividerBlock | ImageBlock | VideoBlock | BulletedListBlock;

export interface Doc {
  id: string;
  title: string;
  blocks: DocBlock[];
  updatedAt: string;
}

// Tree for organizing documents in levels
export type TreeNode = FolderNode | DocRefNode;

export interface FolderNode {
  id: string;
  type: 'folder';
  title: string;
  children: TreeNode[];
}

export interface DocRefNode {
  id: string;
  type: 'doc';
  title: string; // mirrored from the doc's title
  docId: string; // reference to Doc.id
}

// Helpers
const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// Sidebar palette item definition
const palette: { type: BlockType; label: string; description: string; icon: React.ReactNode }[] = [
  { type: 'heading', label: 'Heading', description: 'Large section heading', icon: <TitleIcon /> },
  { type: 'text', label: 'Text', description: 'Rich text paragraph', icon: <TextFieldsIcon /> },
  { type: 'divider', label: 'Divider', description: 'Horizontal separator', icon: <HorizontalRuleIcon /> },
  { type: 'image', label: 'Image', description: 'Image by URL', icon: <ImageIcon /> },
  { type: 'bulletedList', label: 'Bulleted List', description: 'List of bullet points', icon: <FormatListBulletedIcon /> },
  { type: 'video', label: 'Video', description: 'Video embed URL (YouTube, etc.)', icon: <MovieIcon /> },
];

// Block renderers/editors
const HeadingBlockEditor: React.FC<{
  block: HeadingBlock;
  onChange: (patch: Partial<HeadingBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  return (
    <Box>
      <TextField
        fullWidth
        variant="standard"
        placeholder="Heading"
        value={block.text}
        onChange={(e) => onChange({ text: e.target.value })}
        InputProps={{
          sx: {
            fontSize: 28,
            fontWeight: 700,
            textAlign: settings.align || 'left',
            color: settings.color || 'inherit',
          },
        }}
      />
      <BlockSettingsBar settings={settings} onSettingsChange={onSettingsChange} enableColor enableAlign />
    </Box>
  );
};

const TextToolbar: React.FC = () => {
  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
  };
  return (
    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
      <Tooltip title="Bold"><IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}><FormatBoldIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Italic"><IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}><FormatItalicIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Underline"><IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}><FormatUnderlinedIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Bulleted list"><IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}><FormatListBulletedIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Numbered list"><IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')}><FormatListNumberedIcon fontSize="small" /></IconButton></Tooltip>
    </Stack>
  );
};

const TextBlockEditor: React.FC<{
  block: TextBlock;
  onChange: (patch: Partial<TextBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Box>
      <TextToolbar />
      <Box
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange({ html: (e.currentTarget as HTMLDivElement).innerHTML })}
        dangerouslySetInnerHTML={{ __html: block.html || '' }}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.5,
          minHeight: 80,
          '&:focus': { outline: 'none', borderColor: 'primary.main', boxShadow: (t) => `0 0 0 2px ${alpha(t.palette.primary.main, 0.15)}` },
          textAlign: settings.align || 'left',
          color: settings.color || 'inherit',
        }}
      />
      <BlockSettingsBar settings={settings} onSettingsChange={onSettingsChange} enableColor enableAlign />
    </Box>
  );
};

const BulletedListEditor: React.FC<{
  block: BulletedListBlock;
  onChange: (patch: Partial<BulletedListBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  const addItem = () => onChange({ items: [...block.items, ''] });
  const removeItem = (idx: number) => onChange({ items: block.items.filter((_, i) => i !== idx) });
  const moveItem = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= block.items.length) return;
    const copy = [...block.items];
    const [item] = copy.splice(idx, 1);
    copy.splice(to, 0, item);
    onChange({ items: copy });
  };
  const updateItem = (idx: number, val: string) => {
    const copy = [...block.items];
    copy[idx] = val;
    onChange({ items: copy });
  };
  return (
    <Box>
      <Box sx={{ textAlign: settings.align || 'left', color: settings.color || 'inherit' }}>
        <TextField fullWidth variant="standard" placeholder="List title" value={block.title || ''} onChange={(e) => onChange({ title: e.target.value })} sx={{ mb: 1 }} />
        {block.items.map((it, idx) => (
          <Stack key={idx} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <TextField fullWidth size="small" placeholder={`Item ${idx + 1}`} value={it} onChange={(e) => updateItem(idx, e.target.value)} />
            <Tooltip title="Move up"><span><IconButton size="small" disabled={idx === 0} onClick={() => moveItem(idx, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
            <Tooltip title="Move down"><span><IconButton size="small" disabled={idx === block.items.length - 1} onClick={() => moveItem(idx, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
            <Tooltip title="Remove"><IconButton size="small" color="error" onClick={() => removeItem(idx)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
          </Stack>
        ))}
        <Button startIcon={<AddIcon />} variant="outlined" onClick={addItem}>Add Item</Button>
      </Box>
      <BlockSettingsBar settings={settings} onSettingsChange={onSettingsChange} enableColor enableAlign />
    </Box>
  );
};

const DividerBlockView: React.FC<{ settings: BlockSettings }> = ({ settings }) => (
  <Divider sx={{ borderColor: settings.dividerColor, borderBottomWidth: settings.dividerThickness || 1 }} />
);

const ImageBlockEditor: React.FC<{
  block: ImageBlock;
  onChange: (patch: Partial<ImageBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        label="Image URL"
        placeholder="https://..."
        value={block.url}
        onChange={(e) => onChange({ url: e.target.value })}
        sx={{ mb: 1 }}
      />
      {block.url && (
        <Box sx={{ textAlign: settings.align || 'center', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', p: 1 }}>
          <img src={block.url} alt={block.caption || 'image'} style={{ maxWidth: '100%', borderRadius: 8 }} />
        </Box>
      )}
      <TextField
        fullWidth
        variant="standard"
        placeholder="Caption (optional)"
        value={block.caption || ''}
        onChange={(e) => onChange({ caption: e.target.value })}
        sx={{ mt: 1 }}
      />
      <BlockSettingsBar settings={settings} onSettingsChange={onSettingsChange} enableAlign />
    </Box>
  );
};

const VideoBlockEditor: React.FC<{
  block: VideoBlock;
  onChange: (patch: Partial<VideoBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  const isYouTube = /youtu\.be|youtube\.com/.test(block.url);
  const embedUrl = useMemo(() => {
    if (!block.url) return '';
    if (isYouTube) {
      try {
        const url = new URL(block.url);
        const v = url.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length) return `https://www.youtube.com/embed/${parts[0]}`;
      } catch {}
    }
    return block.url;
  }, [block.url, isYouTube]);

  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        label="Video URL"
        placeholder="https://..."
        value={block.url}
        onChange={(e) => onChange({ url: e.target.value })}
        sx={{ mb: 1 }}
      />
      {block.url && (
        <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ position: 'absolute', inset: 0 }}>
            {isYouTube ? (
              <iframe
                title={block.caption || 'video'}
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={block.url} controls style={{ width: '100%', height: '100%' }} />
            )}
          </Box>
        </Box>
      )}
      <TextField
        fullWidth
        variant="standard"
        placeholder="Caption (optional)"
        value={block.caption || ''}
        onChange={(e) => onChange({ caption: e.target.value })}
        sx={{ mt: 1 }}
      />
      <BlockSettingsBar settings={settings} onSettingsChange={onSettingsChange} enableAlign />
    </Box>
  );
};

// Block settings toolbar
const BlockSettingsBar: React.FC<{
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
  enableAlign?: boolean;
  enableColor?: boolean;
  enableDivider?: boolean;
}> = ({ settings, onSettingsChange, enableAlign, enableColor, enableDivider }) => {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      {enableAlign && (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Align left"><IconButton size="small" onClick={() => onSettingsChange({ align: 'left' })}><AlignHorizontalLeftIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Align center"><IconButton size="small" onClick={() => onSettingsChange({ align: 'center' })}><AlignHorizontalCenterIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Align right"><IconButton size="small" onClick={() => onSettingsChange({ align: 'right' })}><AlignHorizontalRightIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      )}
      {enableColor && (
        <Stack direction="row" spacing={1} alignItems="center">
          <ColorLensIcon fontSize="small" />
          <input type="color" value={settings.color || '#000000'} onChange={(e) => onSettingsChange({ color: e.target.value })} />
        </Stack>
      )}
      {enableDivider && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption">Color:</Typography>
          <input type="color" value={settings.dividerColor || '#e0e0e0'} onChange={(e) => onSettingsChange({ dividerColor: e.target.value })} />
          <Typography variant="caption">Thickness:</Typography>
          <TextField type="number" size="small" value={settings.dividerThickness || 1} onChange={(e) => onSettingsChange({ dividerThickness: parseInt(e.target.value || '1', 10) })} sx={{ width: 80 }} />
        </Stack>
      )}
    </Stack>
  );
};

// Block shell with actions + drag and drop
const BlockContainer: React.FC<{
  children: React.ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  draggable?: boolean;
  dragHandlers?: {
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}> = ({ children, onMoveUp, onMoveDown, onDelete, draggable, dragHandlers }) => {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      draggable={draggable}
      onDragStart={dragHandlers?.onDragStart}
      onDragOver={dragHandlers?.onDragOver}
      onDrop={dragHandlers?.onDrop}
      sx={{
        mb: 2,
        borderRadius: 2,
        borderColor: alpha(theme.palette.text.primary, 0.1),
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.4),
        },
      }}
    >
      <CardContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mb: 1 }}>
          {onMoveUp && (
            <Tooltip title="Move up">
              <IconButton size="small" onMouseDown={(e) => e.stopPropagation()} onClick={onMoveUp}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onMoveDown && (
            <Tooltip title="Move down">
              <IconButton size="small" onMouseDown={(e) => e.stopPropagation()} onClick={onMoveDown}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete block">
              <IconButton size="small" color="error" onMouseDown={(e) => e.stopPropagation()} onClick={onDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
};

// Server persistence helpers (graceful fallback to localStorage)
async function saveDocServer(doc: Doc): Promise<boolean> {
  try {
    const res = await fetch(`/api/docs/${doc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadDocsServer(): Promise<Doc[] | null> {
  try {
    const res = await fetch('/api/docs', { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    return data as Doc[];
  } catch {
    return null;
  }
}

// Tree server helpers
type ServerDocNode = {
  id: string;
  type: 'FOLDER' | 'DOC';
  title: string;
  parentId: string | null;
  position: number;
  docId?: string | null;
};

async function loadTreeServer(): Promise<ServerDocNode[] | null> {
  try {
    const res = await fetch('/api/docsbuilder/tree', { method: 'GET' });
    if (!res.ok) return null;
    return (await res.json()) as ServerDocNode[];
  } catch {
    return null;
  }
}

async function createFolderServer(title: string, parentId: string | null) {
  const res = await fetch('/api/docsbuilder/tree/folder', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, parentId }),
  });
  if (!res.ok) throw new Error('Failed to create folder');
  return (await res.json()) as ServerDocNode;
}

async function createDocServer(title: string, blocks: DocBlock[]) {
  const res = await fetch('/api/docs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, blocks }),
  });
  if (!res.ok) throw new Error('Failed to create doc');
  return (await res.json()) as Doc;
}

async function createDocNodeServer(title: string, parentId: string | null, docId: string) {
  const res = await fetch('/api/docsbuilder/tree/doc', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, parentId, docId }),
  });
  if (!res.ok) throw new Error('Failed to create doc node');
  return (await res.json()) as ServerDocNode;
}

async function renameNodeServer(id: string, title: string) {
  const res = await fetch(`/api/docsbuilder/tree/${id}/rename`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to rename node');
  return (await res.json()) as ServerDocNode;
}

async function deleteNodeServer(id: string) {
  const res = await fetch(`/api/docsbuilder/tree/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete node');
}

// Build nested tree from flat list
function buildTree(nodes: ServerDocNode[]): TreeNode[] {
  const byId: Record<string, FolderNode | DocRefNode> = {};
  const childrenMap: Record<string, (FolderNode | DocRefNode)[]> = {};
  const roots: (FolderNode | DocRefNode)[] = [];

  // Create shallow nodes
  nodes.forEach((n) => {
    if (n.type === 'FOLDER') {
      byId[n.id] = { id: n.id, type: 'folder', title: n.title, children: [] };
    } else {
      byId[n.id] = { id: n.id, type: 'doc', title: n.title, docId: n.docId || '' } as DocRefNode;
    }
  });

  // Group by parent
  nodes.forEach((n) => {
    const node = byId[n.id];
    const pid = n.parentId || '__root__';
    if (!childrenMap[pid]) childrenMap[pid] = [];
    childrenMap[pid].push(node);
  });

  // Assign children with order
  Object.keys(childrenMap).forEach((pid) => {
    const arr = childrenMap[pid];
    // sort by position by referencing original nodes
    arr.sort((a, b) => {
      const pa = nodes.find((x) => x.id === a.id)?.position ?? 0;
      const pb = nodes.find((x) => x.id === b.id)?.position ?? 0;
      return pa - pb;
    });
    if (pid === '__root__') {
      roots.push(...arr);
    } else {
      const p = byId[pid];
      if (p && p.type === 'folder') (p as FolderNode).children = arr as TreeNode[];
    }
  });

  return roots as TreeNode[];
}

// Main builder component
const DocsBuilder: React.FC = () => {
  const theme = useTheme();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [preview, setPreview] = useState<boolean>(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);

  const currentDoc = useMemo(() => docs.find((d) => d.id === currentDocId) || null, [docs, currentDocId]);

  // Initial load: fetch docs and tree from server
  useEffect(() => {
    (async () => {
      const serverDocs = await loadDocsServer();
      setDocs(serverDocs || []);
      setCurrentDocId(serverDocs && serverDocs.length ? serverDocs[0].id : null);

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
      default:
        block = base;
    }

    if (!currentDoc) {
      // No document selected: create one on server then insert block
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

    setDocs((prev) => prev.map((d) => (d.id === currentDoc.id ? { ...d, blocks: [...d.blocks, block], updatedAt: new Date().toISOString() } : d)));
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

  // Tree helpers
  const isFolder = (n: TreeNode): n is FolderNode => n.type === 'folder';

  const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (isFolder(n)) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const insertChild = (nodes: TreeNode[], parentId: string | null, child: TreeNode): TreeNode[] => {
    if (!parentId) return [...nodes, child];
    return nodes.map((n) => {
      if (isFolder(n)) {
        if (n.id === parentId) {
          return { ...n, children: [...n.children, child] };
        }
        return { ...n, children: insertChild(n.children, parentId, child) };
      }
      return n;
    });
  };

  const mapTree = (nodes: TreeNode[], mapper: (n: TreeNode) => TreeNode): TreeNode[] => {
    return nodes.map((n) => {
      if (isFolder(n)) {
        const mapped = mapper({ ...n, children: mapTree(n.children, mapper) });
        return mapped;
      }
      return mapper(n);
    });
  };

  const removeNode = (nodes: TreeNode[], id: string): { nodes: TreeNode[]; removed?: TreeNode } => {
    const result: TreeNode[] = [];
    let removed: TreeNode | undefined;
    for (const n of nodes) {
      if (n.id === id) {
        removed = n;
        continue;
      }
      if (isFolder(n)) {
        const { nodes: childNodes, removed: r } = removeNode(n.children, id);
        if (r) removed = r;
        result.push({ ...n, children: childNodes });
      } else {
        result.push(n);
      }
    }
    return { nodes: result, removed };
  };

  const collectDocIds = (node: TreeNode): string[] => {
    if (node.type === 'doc') return [node.docId];
    return node.children.flatMap(collectDocIds);
  };

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
    setTree((prev) => mapTree(prev, (n) => (n.id === id ? ({ ...(n as any), title: updated.title } as TreeNode) : n)));
    // Mirror doc title in local state too
    const node = (function find(nodes: TreeNode[]): DocRefNode | null {
      for (const n of nodes) {
        if (n.id === id && n.type === 'doc') return n as DocRefNode;
        if (n.type === 'folder') { const f = find((n as FolderNode).children); if (f) return f; }
      }
      return null;
    })(tree);
    if (node && node.docId) {
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

  const renderTree = (nodes: TreeNode[], depth = 0): React.ReactNode => {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        const open = !!expanded[node.id];
        return (
          <Box key={node.id}>
            <ListItem
              disablePadding
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => addFolder(node.id)}><CreateNewFolderIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => addDocUnder(node.id)}><AddIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => {
                    const title = prompt('Rename folder', node.title) || node.title;
                    renameNode(node.id, title);
                  }}><DriveFileRenameOutlineIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => deleteNodeAndDocs(node.id)}><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
              }
            >
              <ListItemButton onClick={() => { toggleExpand(node.id); setSelectedTreeId(node.id); }} sx={{ pl: 1 + depth * 2 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>{open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</ListItemIcon>
                <ListItemIcon sx={{ minWidth: 28 }}><FolderIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary={node.title} />
              </ListItemButton>
            </ListItem>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List dense disablePadding>
                {renderTree(node.children, depth + 1)}
              </List>
            </Collapse>
          </Box>
        );
      }
      return (
        <ListItem
          key={node.id}
          disablePadding
          secondaryAction={
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={() => {
                const title = prompt('Rename document', node.title) || node.title;
                renameNode(node.id, title);
              }}><DriveFileRenameOutlineIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="error" onClick={() => deleteNodeAndDocs(node.id)}><DeleteIcon fontSize="small" /></IconButton>
            </Stack>
          }
        >
          <ListItemButton selected={currentDocId === node.docId} onClick={() => { setCurrentDocId(node.docId); setSelectedTreeId(node.id); }} sx={{ pl: 7 + depth * 2 }}>
            <ListItemIcon sx={{ minWidth: 28 }}><DescriptionIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary={node.title} secondary={(() => {
              const d = docs.find((x) => x.id === node.docId);
              return d ? new Date(d.updatedAt).toLocaleString() : undefined;
            })()} />
          </ListItemButton>
        </ListItem>
      );
    });
  };

  // Docs management

 const saveCurrentDoc = async () => {
    if (!currentDoc) return;
    const success = await saveDocServer(currentDoc);
    if (!success) {
      // already saved to localStorage via effect, do nothing else
    }
  };

  const resetCurrent = () => {
    if (!currentDoc) return;
    setDocs((prev) => prev.map((d) => (d.id === currentDoc.id ? { ...d, blocks: [], updatedAt: new Date().toISOString() } : d)));
  };

  const rightActions = (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="outlined"
        startIcon={preview ? <EditIcon /> : <VisibilityIcon />}
        onClick={() => setPreview((p) => !p)}
      >
        {preview ? 'Back to Editor' : 'Preview'}
      </Button>
      <Tooltip title="Save (server when available, otherwise local)">
        <span>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveCurrentDoc}
            disabled={!currentDoc}
          >
            Save
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Clear blocks in current document">
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RestoreIcon />}
          onClick={resetCurrent}
          disabled={!currentDoc}
        >
          Reset
        </Button>
      </Tooltip>
    </Box>
  );

  return (
    <Box>
      <MyGridHeader title="Documentation Builder" icon={TextFieldsIcon as any} rightActions={rightActions} />

      {preview ? (
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          {!currentDoc || currentDoc.blocks.length === 0 ? (
            <Card sx={{ borderRadius: 2, p: 3, mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Nothing to preview yet. Add some blocks in the editor.
              </Typography>
            </Card>
          ) : (
            currentDoc.blocks.map((block) => (
              <Card key={block.id} sx={{ borderRadius: 2, p: 2, mb: 2 }}>
                {block.type === 'heading' && (
                  <Typography variant="h4" sx={{ fontWeight: 700, textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit' }}>
                    {(block as HeadingBlock).text}
                  </Typography>
                )}
                {block.type === 'text' && (
                  <Typography component="div" sx={{ whiteSpace: 'pre-wrap', textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit' }}
                    dangerouslySetInnerHTML={{ __html: (block as TextBlock).html }}
                  />
                )}
                {block.type === 'bulletedList' && (
                  <Box sx={{ textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit' }}>
                    {(block as BulletedListBlock).title && (
                      <Typography variant="h6" sx={{ mt: 0, mb: 1, fontWeight: 600 }}>
                        {(block as BulletedListBlock).title}
                      </Typography>
                    )}
                    <ul style={{ marginTop: 0 }}>
                      {(block as BulletedListBlock).items.filter(Boolean).map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  </Box>
                )}
                {block.type === 'divider' && (
                  <Divider sx={{ borderColor: block.settings?.dividerColor, borderBottomWidth: block.settings?.dividerThickness || 1 }} />
                )}
                {block.type === 'image' && (
                  <Box sx={{ textAlign: block.settings?.align || 'center' }}>
                    {(block as ImageBlock).url && (
                      <img src={(block as ImageBlock).url} alt={(block as ImageBlock).caption || 'image'} style={{ maxWidth: '100%', borderRadius: 8 }} />
                    )}
                    {(block as ImageBlock).caption && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {(block as ImageBlock).caption}
                      </Typography>
                    )}
                  </Box>
                )}
                {block.type === 'video' && (
                  <Box>
                    {(() => {
                      const url = (block as VideoBlock).url as string;
                      const isYouTube = /youtu\.be|youtube\.com/.test(url);
                      if (isYouTube) {
                        try {
                          const u = new URL(url);
                          const v = u.searchParams.get('v');
                          const pathId = u.pathname.split('/').filter(Boolean)[0];
                          const id = v || pathId;
                          return id ? (
                            <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden' }}>
                              <Box sx={{ position: 'absolute', inset: 0 }}>
                                <iframe
                                  title={(block as VideoBlock).caption || 'video'}
                                  src={`https://www.youtube.com/embed/${id}`}
                                  width="100%"
                                  height="100%"
                                  frameBorder={0}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </Box>
                            </Box>
                          ) : null;
                        } catch {
                          return null;
                        }
                      }
                      return url ? (
                        <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden' }}>
                          <Box sx={{ position: 'absolute', inset: 0 }}>
                            <video src={url} controls style={{ width: '100%', height: '100%' }} />
                          </Box>
                        </Box>
                      ) : null;
                    })()}
                    {(block as VideoBlock).caption && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {(block as VideoBlock).caption}
                      </Typography>
                    )}
                  </Box>
                )}
              </Card>
            ))
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Sidebar - documents list and components palette */}
          <Card
            sx={{
              width: 320,
              flexShrink: 0,
              order: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.25),
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                Components
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click to insert a block
              </Typography>
              <List dense>
                {palette.map((p) => (
                  <ListItem key={p.type} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton onClick={() => addBlock(p.type)}>
                      <ListItemIcon>{p.icon}</ListItemIcon>
                      <ListItemText primary={p.label} secondary={p.description} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Button fullWidth startIcon={<AddIcon />} variant="outlined" onClick={() => addBlock('text')}>
                New Text
              </Button>
            </CardContent>
          </Card>

          {/* Right - Documents Tree */}
          <Card
            sx={{
              width: 320,
              flexShrink: 0,
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.25),
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              order: 3,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotesIcon fontSize="small" /> Documents
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Button size="small" variant="outlined" startIcon={<CreateNewFolderIcon />} onClick={() => addFolder(null)}>New Folder</Button>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addDocUnder(selectedTreeId && findNode(tree, selectedTreeId)?.type === 'folder' ? selectedTreeId : null)}>New Doc</Button>
                <Button size="small" variant="outlined" startIcon={<SaveIcon />} onClick={saveCurrentDoc} disabled={!currentDoc}>Save</Button>
              </Stack>
              <List dense sx={{ mb: 2, maxHeight: 220, overflow: 'auto' }}>
                {renderTree(tree, 0)}
              </List>
            </CardContent>
          </Card>

          {/* Editor area */}
          <Box sx={{ flex: 1, order: 2 }}>
            {!currentDoc || currentDoc.blocks.length === 0 ? (
              <Card sx={{ borderRadius: 2, p: 3, mb: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  {currentDoc ? 'Start by selecting a block from the left sidebar to build your documentation.' : 'Create or select a document to start editing.'}
                </Typography>
              </Card>
            ) : null}

            {currentDoc?.blocks.map((block, idx) => {
              const commonActions = {
                onMoveUp: idx > 0 ? () => moveBlock(block.id, -1) : undefined,
                onMoveDown: currentDoc.blocks && idx < currentDoc.blocks.length - 1 ? () => moveBlock(block.id, 1) : undefined,
                onDelete: () => removeBlock(block.id),
              };

              const dragHandlers = dndHandlers(block.id);

              switch (block.type) {
                case 'heading':
                  return (
                    <BlockContainer key={block.id} {...commonActions} draggable dragHandlers={dragHandlers}>
                      <HeadingBlockEditor
                        block={block as HeadingBlock}
                        onChange={(p) => updateBlock(block.id, p)}
                        settings={block.settings || {}}
                        onSettingsChange={(p) => updateBlockSettings(block.id, p)}
                      />
                    </BlockContainer>
                  );
                case 'text':
                  return (
                    <BlockContainer key={block.id} {...commonActions} draggable dragHandlers={dragHandlers}>
                      <TextBlockEditor
                        block={block as TextBlock}
                        onChange={(p) => updateBlock(block.id, p)}
                        settings={block.settings || {}}
                        onSettingsChange={(p) => updateBlockSettings(block.id, p)}
                      />
                    </BlockContainer>
                  );
                case 'bulletedList':
                  return (
                    <BlockContainer key={block.id} {...commonActions} draggable dragHandlers={dragHandlers}>
                      <BulletedListEditor
                        block={block as BulletedListBlock}
                        onChange={(p) => updateBlock(block.id, p)}
                        settings={block.settings || {}}
                        onSettingsChange={(p) => updateBlockSettings(block.id, p)}
                      />
                    </BlockContainer>
                  );
                case 'divider':
                  return (
                    <BlockContainer key={block.id} {...commonActions} draggable dragHandlers={dragHandlers}>
                      <DividerBlockView settings={block.settings || {}} />
                      <BlockSettingsBar settings={block.settings || {}} onSettingsChange={(p) => updateBlockSettings(block.id, p)} enableDivider />
                    </BlockContainer>
                  );
                case 'image':
                  return (
                    <BlockContainer key={block.id} {...commonActions} draggable dragHandlers={dragHandlers}>
                      <ImageBlockEditor
                        block={block as ImageBlock}
                        onChange={(p) => updateBlock(block.id, p)}
                        settings={block.settings || {}}
                        onSettingsChange={(p) => updateBlockSettings(block.id, p)}
                      />
                    </BlockContainer>
                  );
                case 'video':
                  return (
                    <BlockContainer key={block.id} {...commonActions} draggable dragHandlers={dragHandlers}>
                      <VideoBlockEditor
                        block={block as VideoBlock}
                        onChange={(p) => updateBlock(block.id, p)}
                        settings={block.settings || {}}
                        onSettingsChange={(p) => updateBlockSettings(block.id, p)}
                      />
                    </BlockContainer>
                  );
                default:
                  return null;
              }
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DocsBuilder;
