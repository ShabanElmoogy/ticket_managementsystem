import React, { useRef, useState, useEffect } from 'react';
import {
  Box, Typography, List, ListItem, ListItemButton, ListItemIcon,
  Stack, Collapse, IconButton, Tooltip, Button, InputBase, Popover,
} from '@mui/material';
import NotesIcon from '@mui/icons-material/Notes';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { TreeNode, Doc } from '../types';
import { findNode } from '../utils/treeUtils';

// ── Emoji icon picker ─────────────────────────────────────────────────────────

const FOLDER_ICONS = [
  '📁','📂','📚','📖','📝','📋','📌','📎','🗂️','🗃️',
  '💼','🎯','🚀','⭐','🔥','💡','🔧','🎨','🌐','🏠',
  '🔒','🔓','📊','📈','🎓','🏆','💎','🌟','⚡','🎪',
];

const IconPicker: React.FC<{
  current?: string;
  onSelect: (icon: string) => void;
  onClear: () => void;
}> = ({ current, onSelect, onClear }) => (
  <Box sx={{ p: 1.5, width: 220 }}>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
      {FOLDER_ICONS.map((emoji) => (
        <Box
          key={emoji}
          onClick={() => onSelect(emoji)}
          sx={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 1, cursor: 'pointer', fontSize: '1.1rem',
            border: '2px solid', borderColor: current === emoji ? 'primary.main' : 'transparent',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {emoji}
        </Box>
      ))}
    </Box>
    {current && (
      <Button size="small" fullWidth onClick={onClear} sx={{ fontSize: '0.7rem' }}>
        Remove icon
      </Button>
    )}
  </Box>
);

interface Props {
  tree: TreeNode[];
  docs: Doc[];
  currentDocId: string | null;
  selectedTreeId: string | null;
  expanded: Record<string, boolean>;
  sidebarBg: string;
  sidebarBorder: string;
  hoverBg: string;
  selectedBg: string;
  overlay?: boolean;
  onSelectDoc: (docId: string, nodeId: string) => void;
  onSelectFolder: (nodeId: string) => void;
  onToggleExpand: (id: string) => void;
  onAddFolder: (parentId: string | null) => void;
  onAddDoc: (parentId: string | null) => void;
  onRenameRequest: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onSetFolderIcon: (id: string, icon: string) => void;
}

// ── Inline rename input ───────────────────────────────────────────────────────

interface InlineTitleProps {
  title: string;
  isSelected?: boolean;
  fontSize?: string;
  fontWeight?: number | string;
  color?: string;
  onCommit: (newTitle: string) => void;
  onClick: (e: React.MouseEvent) => void;
}

const InlineTitle: React.FC<InlineTitleProps> = ({
  title, isSelected, fontSize = '0.8rem', fontWeight = 400, color, onCommit, onClick,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(title); }, [title]);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(title);
    setEditing(true);
    setTimeout(() => { inputRef.current?.select(); }, 50);
  };

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) onCommit(trimmed);
    else setDraft(title);
  };

  if (editing) {
    return (
      <InputBase
        inputRef={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter')  { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setDraft(title); setEditing(false); }
        }}
        onClick={(e) => e.stopPropagation()}
        autoFocus
        fullWidth
        sx={{
          fontSize, fontWeight,
          '& .MuiInputBase-input': {
            p: 0, py: 0.25,
            borderBottom: '1.5px solid',
            borderColor: 'primary.main',
          },
        }}
      />
    );
  }

  return (
    <Typography
      noWrap
      onDoubleClick={startEdit}
      onClick={onClick}
      sx={{
        fontSize, fontWeight,
        color: color || 'inherit',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {title}
    </Typography>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────

const DocTreeSidebar: React.FC<Props> = ({
  tree, currentDocId, selectedTreeId, expanded,
  sidebarBg, sidebarBorder, hoverBg, selectedBg, overlay = false,
  onSelectDoc, onSelectFolder, onToggleExpand,
  onAddFolder, onAddDoc, onRenameRequest, onDelete, onSetFolderIcon,
}) => {
  const [iconPickerAnchor, setIconPickerAnchor] = useState<{ el: HTMLElement; nodeId: string; current?: string } | null>(null);
  const renderTree = (nodes: TreeNode[], depth = 0): React.ReactNode =>
    nodes.map((node) => {
      if (node.type === 'folder') {
        const open           = !!expanded[node.id];
        const hasDocs        = node.children.some((c) => c.type === 'doc');
        const hasSubfolders  = node.children.some((c) => c.type === 'folder');
        const canAddSubfolder = !hasDocs;

        return (
          <Box key={node.id}>
            <ListItem disablePadding sx={{ '&:hover .tree-actions': { opacity: 1 } }}>
              {/* Folder icon — outside ListItemButton so click doesn't bubble to expand */}
              <Tooltip title="Click to change icon" placement="right">
                <Box
                  onClick={(e) => { e.stopPropagation(); setIconPickerAnchor({ el: e.currentTarget as HTMLElement, nodeId: node.id, current: node.icon }); }}
                  sx={{
                    position: 'absolute',
                    left: 8 + depth * 12,
                    zIndex: 1,
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '0.95rem', borderRadius: 0.5,
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  {node.icon
                    ? node.icon
                    : open
                      ? <FolderOpenIcon sx={{ fontSize: 15, color: '#f59e0b' }} />
                      : <FolderIcon     sx={{ fontSize: 15, color: '#f59e0b' }} />}
                </Box>
              </Tooltip>

              <ListItemButton
                onClick={() => { onToggleExpand(node.id); onSelectFolder(node.id); }}
                sx={{ pl: 1.5 + depth * 1.5 + 2.5, py: 0.5, borderRadius: 1, mx: 0.5, gap: 0.75, '&:hover': { bgcolor: hoverBg } }}
              >
                {/* spacer so text doesn't overlap the absolute icon */}
                <Box sx={{ width: 20, flexShrink: 0 }} />
                <InlineTitle
                  title={node.title}
                  fontSize="0.8rem"
                  fontWeight={500}
                  onCommit={(t) => onRenameRequest(node.id, t)}
                  onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); onSelectFolder(node.id); }}
                />
                {open
                  ? <ExpandLessIcon sx={{ fontSize: 14, opacity: 0.5, flexShrink: 0 }} />
                  : <ExpandMoreIcon sx={{ fontSize: 14, opacity: 0.5, flexShrink: 0 }} />}
              </ListItemButton>

              <Stack className="tree-actions" direction="row" sx={{ position: 'absolute', right: 8, opacity: 0, transition: 'opacity 0.15s', bgcolor: sidebarBg, borderRadius: 1 }}>
                {canAddSubfolder && (
                  <Tooltip title="Add subfolder">
                    <IconButton size="small" sx={{ p: 0.25 }} onClick={() => onAddFolder(node.id)}>
                      <CreateNewFolderIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                )}
                {!hasSubfolders && (
                  <Tooltip title="Add doc">
                    <IconButton size="small" sx={{ p: 0.25 }} onClick={() => onAddDoc(node.id)}>
                      <AddIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete">
                  <IconButton size="small" sx={{ p: 0.25 }} color="error" onClick={() => onDelete(node.id)}>
                    <DeleteIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </ListItem>

            <Collapse in={open} timeout="auto" unmountOnExit>
              {node.children.length === 0 ? (
                <Box sx={{ pl: 3 + depth * 1.5, pr: 1, py: 1, display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Add subfolder">
                    <IconButton size="small" sx={{ p: 0.5, opacity: 0.5, '&:hover': { opacity: 1 } }} onClick={() => onAddFolder(node.id)}>
                      <CreateNewFolderIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add doc">
                    <IconButton size="small" sx={{ p: 0.5, opacity: 0.5, '&:hover': { opacity: 1 } }} onClick={() => onAddDoc(node.id)}>
                      <AddIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" color="text.disabled" sx={{ alignSelf: 'center', fontSize: '0.7rem' }}>
                    Empty folder
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>{renderTree(node.children, depth + 1)}</List>
              )}
            </Collapse>
          </Box>
        );
      }

      // ── Doc node ────────────────────────────────────────────────────────────
      const isSelected = currentDocId === node.docId;
      return (
        <ListItem key={node.id} disablePadding sx={{ '&:hover .tree-actions': { opacity: 1 } }}>
          <ListItemButton
            selected={isSelected}
            onClick={() => node.docId && onSelectDoc(node.docId, node.id)}
            sx={{
              pl: 2 + depth * 1.5, py: 0.5, borderRadius: 1, mx: 0.5, gap: 0.75,
              '&:hover': { bgcolor: hoverBg },
              '&.Mui-selected': { bgcolor: selectedBg, '&:hover': { bgcolor: selectedBg } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 20 }}>
              <DescriptionIcon sx={{ fontSize: 14, color: isSelected ? 'primary.main' : 'text.disabled' }} />
            </ListItemIcon>
            <InlineTitle
              title={node.title}
              isSelected={isSelected}
              fontSize="0.8rem"
              fontWeight={isSelected ? 600 : 400}
              color={isSelected ? 'primary.main' : 'text.primary'}
              onCommit={(t) => onRenameRequest(node.id, t)}
              onClick={(e) => { e.stopPropagation(); node.docId && onSelectDoc(node.docId, node.id); }}
            />
          </ListItemButton>

          <Stack className="tree-actions" direction="row" sx={{ position: 'absolute', right: 8, opacity: 0, transition: 'opacity 0.15s', bgcolor: sidebarBg, borderRadius: 1 }}>
            <Tooltip title="Delete">
              <IconButton size="small" sx={{ p: 0.25 }} color="error" onClick={() => onDelete(node.id)}>
                <DeleteIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </ListItem>
      );
    });

  return (
    <Box sx={{
      width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
      bgcolor: sidebarBg, borderRight: `1px solid ${sidebarBorder}`, overflow: 'hidden',
      ...(overlay && { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10, boxShadow: '4px 0 12px rgba(0,0,0,0.15)' }),
    }}>
      {/* Header */}
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: `1px solid ${sidebarBorder}`, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <NotesIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} sx={{ flex: 1 }}>
          Documents
        </Typography>
        <Tooltip title="New folder">
          <IconButton size="small" sx={{ p: 0.25 }} onClick={() => onAddFolder(null)}>
            <CreateNewFolderIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="New document">
          <IconButton size="small" sx={{ p: 0.25 }} onClick={() => onAddDoc(selectedTreeId && findNode(tree, selectedTreeId)?.type === 'folder' ? selectedTreeId : null)}>
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
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => onAddDoc(null)} sx={{ fontSize: '0.7rem' }}>
                New Doc
              </Button>
            </Box>
          </Box>
        ) : (
          <List dense disablePadding>{renderTree(tree)}</List>
        )}
      </Box>
      {/* Icon picker popover */}
      <Popover
        open={!!iconPickerAnchor}
        anchorEl={iconPickerAnchor?.el}
        onClose={() => setIconPickerAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        disableScrollLock
      >
        <IconPicker
          current={iconPickerAnchor?.current}
          onSelect={(icon) => {
            if (iconPickerAnchor) onSetFolderIcon(iconPickerAnchor.nodeId, icon);
            setIconPickerAnchor(null);
          }}
          onClear={() => {
            if (iconPickerAnchor) onSetFolderIcon(iconPickerAnchor.nodeId, '');
            setIconPickerAnchor(null);
          }}
        />
      </Popover>
    </Box>
  );
};

export default DocTreeSidebar;
