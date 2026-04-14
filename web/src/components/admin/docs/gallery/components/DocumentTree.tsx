/**
 * DocumentTree — read-only tree for the gallery view.
 * Matches DocTreeSidebar's visual style but has no edit actions.
 */
import React from 'react';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon, Collapse,
  Typography, ToggleButtonGroup, ToggleButton, alpha, useTheme,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { TreeNode, Doc } from '../../types';
import HighlightText from './HighlightText';

interface DocumentTreeProps {
  tree: TreeNode[];
  docs: Doc[];
  expanded: Record<string, boolean>;
  treeOpenMode: 'tab' | 'dialog';
  searchQuery?: string;
  onToggleExpand: (nodeId: string) => void;
  onPreview: (doc: Doc) => void;
  onTreeOpenModeChange: (mode: 'tab' | 'dialog') => void;
}

const DocumentTree: React.FC<DocumentTreeProps> = ({
  tree, docs, expanded, treeOpenMode, searchQuery = '',
  onToggleExpand, onPreview, onTreeOpenModeChange,
}) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const hoverBg    = isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04);
  const selectedBg = isDark ? alpha('#3b82f6', 0.15) : alpha('#3b82f6', 0.08);

  const renderNode = (node: TreeNode, depth = 0): React.ReactNode => {
    const open = !!expanded[node.id];

    if (node.type === 'folder') {
      return (
        <Box key={node.id}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => onToggleExpand(node.id)}
              sx={{ pl: 1.5 + depth * 1.5, py: 0.5, borderRadius: 1, mx: 0.5, gap: 0.75, '&:hover': { bgcolor: hoverBg } }}
            >
              <ListItemIcon sx={{ minWidth: 20 }}>
                {node.icon
                  ? <Box component="span" sx={{ fontSize: '0.95rem', lineHeight: 1 }}>{node.icon}</Box>
                  : open
                    ? <FolderOpenIcon sx={{ fontSize: 15, color: '#f59e0b' }} />
                    : <FolderIcon     sx={{ fontSize: 15, color: '#f59e0b' }} />}
              </ListItemIcon>
              <Typography variant="body2" noWrap sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 500 }}>
                <HighlightText text={node.title} query={searchQuery} />
              </Typography>
              {open
                ? <ExpandLessIcon sx={{ fontSize: 14, opacity: 0.5, flexShrink: 0 }} />
                : <ExpandMoreIcon sx={{ fontSize: 14, opacity: 0.5, flexShrink: 0 }} />}
            </ListItemButton>
          </ListItem>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List dense disablePadding>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </List>
          </Collapse>
        </Box>
      );
    }

    const doc = docs.find((d) => d.id === node.docId);
    if (!doc) return null;

    const isMatch = searchQuery.trim() !== '' && doc.title.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      <ListItem key={node.id} disablePadding>
        <ListItemButton
          onClick={() => onPreview(doc)}
          sx={{
            pl: 2 + depth * 1.5, py: 0.5, borderRadius: 1, mx: 0.5, gap: 0.75,
            '&:hover': { bgcolor: hoverBg },
            ...(isMatch && { bgcolor: selectedBg }),
          }}
        >
          <ListItemIcon sx={{ minWidth: 20 }}>
            <DescriptionIcon sx={{ fontSize: 14, color: isMatch ? 'primary.main' : 'text.disabled' }} />
          </ListItemIcon>
          <Typography
            variant="body2" noWrap
            sx={{ flex: 1, fontSize: '0.8rem', color: isMatch ? 'primary.main' : 'text.primary', fontWeight: isMatch ? 600 : 400 }}
          >
            <HighlightText text={doc.title} query={searchQuery} />
          </Typography>
        </ListItemButton>
      </ListItem>
    );
  };

  return (
    <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>
          Documents
        </Typography>
        <ToggleButtonGroup
          value={treeOpenMode} exclusive size="small"
          onChange={(_, v) => v && onTreeOpenModeChange(v)}
          sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1, fontSize: '0.7rem', textTransform: 'none' } }}
        >
          <ToggleButton value="tab">Tab</ToggleButton>
          <ToggleButton value="dialog">Dialog</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{
        border: '1px solid', borderColor: 'divider', borderRadius: 1,
        maxHeight: { xs: 260, md: '65vh' }, overflowY: 'auto',
        bgcolor: isDark ? '#0f172a' : '#f8fafc',
      }}>
        {tree.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.disabled">No documents</Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ py: 0.5 }}>
            {tree.map((node) => renderNode(node))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default DocumentTree;
