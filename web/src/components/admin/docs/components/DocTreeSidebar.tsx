import React from 'react';
import {
  Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Stack, Collapse, IconButton, Tooltip, Button,
} from '@mui/material';
import NotesIcon from '@mui/icons-material/Notes';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import AddIcon from '@mui/icons-material/Add';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import type { TreeNode, Doc } from '../types';
import { findNode } from '../utils/treeUtils';

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
}

const DocTreeSidebar: React.FC<Props> = ({
  tree, docs, currentDocId, selectedTreeId, expanded,
  sidebarBg, sidebarBorder, hoverBg, selectedBg, overlay = false,
  onSelectDoc, onSelectFolder, onToggleExpand,
  onAddFolder, onAddDoc, onRenameRequest, onDelete,
}) => {
  const renderTree = (nodes: TreeNode[], depth = 0): React.ReactNode =>
    nodes.map((node) => {
      if (node.type === 'folder') {
        const open = !!expanded[node.id];
        return (
          <Box key={node.id}>
            <ListItem disablePadding sx={{ '&:hover .tree-actions': { opacity: 1 } }}>
              <ListItemButton
                onClick={() => { onToggleExpand(node.id); onSelectFolder(node.id); }}
                sx={{ pl: 1.5 + depth * 1.5, py: 0.5, borderRadius: 1, mx: 0.5, '&:hover': { bgcolor: hoverBg } }}
              >
                <ListItemIcon sx={{ minWidth: 24 }}>
                  {open ? <FolderOpenIcon sx={{ fontSize: 15, color: '#f59e0b' }} /> : <FolderIcon sx={{ fontSize: 15, color: '#f59e0b' }} />}
                </ListItemIcon>
                <ListItemText
                  primary={node.title}
                  slotProps={{ primary: { variant: 'body2', fontWeight: 500, fontSize: '0.8rem', noWrap: true } as any }}
                />
                {open ? <ExpandLessIcon sx={{ fontSize: 14, opacity: 0.5 }} /> : <ExpandMoreIcon sx={{ fontSize: 14, opacity: 0.5 }} />}
              </ListItemButton>
              <Stack className="tree-actions" direction="row" sx={{ position: 'absolute', right: 8, opacity: 0, transition: 'opacity 0.15s', bgcolor: sidebarBg, borderRadius: 1 }}>
                <Tooltip title="Add doc"><IconButton size="small" sx={{ p: 0.25 }} onClick={() => onAddDoc(node.id)}><AddIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
                <Tooltip title="Rename"><IconButton size="small" sx={{ p: 0.25 }} onClick={() => onRenameRequest(node.id, node.title)}><DriveFileRenameOutlineIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" sx={{ p: 0.25 }} color="error" onClick={() => onDelete(node.id)}><DeleteIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
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
            onClick={() => node.docId && onSelectDoc(node.docId, node.id)}
            sx={{
              pl: 2 + depth * 1.5, py: 0.5, borderRadius: 1, mx: 0.5,
              '&:hover': { bgcolor: hoverBg },
              '&.Mui-selected': { bgcolor: selectedBg, '&:hover': { bgcolor: selectedBg } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 22 }}>
              <DescriptionIcon sx={{ fontSize: 14, color: isSelected ? 'primary.main' : 'text.disabled' }} />
            </ListItemIcon>
            <ListItemText
              primary={node.title}
              slotProps={{ primary: { variant: 'body2', fontSize: '0.8rem', noWrap: true, color: isSelected ? 'primary.main' : 'text.primary', fontWeight: isSelected ? 600 : 400 } as any }}
            />
          </ListItemButton>
          <Stack className="tree-actions" direction="row" sx={{ position: 'absolute', right: 8, opacity: 0, transition: 'opacity 0.15s', bgcolor: sidebarBg, borderRadius: 1 }}>
            <Tooltip title="Rename"><IconButton size="small" sx={{ p: 0.25 }} onClick={() => onRenameRequest(node.id, node.title)}><DriveFileRenameOutlineIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" sx={{ p: 0.25 }} color="error" onClick={() => onDelete(node.id)}><DeleteIcon sx={{ fontSize: 13 }} /></IconButton></Tooltip>
          </Stack>
        </ListItem>
      );
    });

  return (
    <Box sx={{
      width: 240,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: sidebarBg,
      borderRight: `1px solid ${sidebarBorder}`,
      overflow: 'hidden',
      ...(overlay && {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 10,
        boxShadow: '4px 0 12px rgba(0,0,0,0.15)',
      }),
    }}>
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: `1px solid ${sidebarBorder}`, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <NotesIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} sx={{ flex: 1 }}>
          Documents
        </Typography>
        <Tooltip title="New folder">
          <IconButton size="small" sx={{ p: 0.25 }} onClick={() => onAddFolder(null)}><CreateNewFolderIcon sx={{ fontSize: 14 }} /></IconButton>
        </Tooltip>
        <Tooltip title="New document">
          <IconButton size="small" sx={{ p: 0.25 }} onClick={() => onAddDoc(selectedTreeId && findNode(tree, selectedTreeId)?.type === 'folder' ? selectedTreeId : null)}>
            <AddIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
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
    </Box>
  );
};

export default DocTreeSidebar;
