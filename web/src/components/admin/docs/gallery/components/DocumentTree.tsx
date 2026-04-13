import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Description as DescriptionIcon,
  ExpandLess,
  ExpandMore,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import type { TreeNode, Doc } from "../../types";
import HighlightText from "./HighlightText";
import { formatDate } from "../../../../../shared/utils/dateUtils";

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
  tree,
  docs,
  expanded,
  treeOpenMode,
  searchQuery = '',
  onToggleExpand,
  onPreview,
  onTreeOpenModeChange,
}) => {
  const renderTreeNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expanded[node.id];
    const paddingLeft = level * 24;

    if (node.type === 'folder') {
      return (
        <Box key={node.id}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => onToggleExpand(node.id)}
              sx={{ pl: paddingLeft / 8 }}
            >
              <ListItemIcon>
                {isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
              </ListItemIcon>
              <ListItemText
                primary={<HighlightText text={node.title} query={searchQuery} />}
              />
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {node.children.map((child) => renderTreeNode(child, level + 1))}
            </List>
          </Collapse>
        </Box>
      );
    } else {
      const doc = docs.find((d) => d.id === node.docId);
      if (!doc) return null;

      const isMatch = searchQuery.trim() !== '' && doc.title.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        <ListItem key={node.id} disablePadding>
          <ListItemButton
            sx={{
              pl: paddingLeft / 8,
              ...(isMatch && {
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.main' },
              }),
            }}
            onClick={() => onPreview(doc)}
          >
            <ListItemIcon>
              <DescriptionIcon />
            </ListItemIcon>
            <ListItemText
              primary={<HighlightText text={doc.title} query={searchQuery} />}
              secondary={`Updated: ${formatDate(doc.updatedAt)}`}
            />
          </ListItemButton>
          <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>
            <IconButton size="small" onClick={() => onPreview(doc)}>
              <VisibilityIcon />
            </IconButton>
          </Box>
        </ListItem>
      );
    }
  };

  return (
    <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Document Tree</Typography>
        <ToggleButtonGroup
          value={treeOpenMode}
          exclusive
          onChange={(_, newMode) => newMode && onTreeOpenModeChange(newMode)}
          size="small"
        >
          <ToggleButton value="tab">Tab</ToggleButton>
          <ToggleButton value="dialog">Dialog</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <List sx={{ maxHeight: { xs: 260, md: '60vh' }, overflow: 'auto' }}>
        {tree.map((node) => renderTreeNode(node))}
      </List>
    </Box>
  );
};

export default DocumentTree;