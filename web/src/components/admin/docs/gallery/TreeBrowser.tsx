import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import type { Doc, TreeNode } from '../types';
import { DocumentTree, DocumentTabs } from './components';

interface Props {
  tree: TreeNode[];
  docs: Doc[];
  expanded: Record<string, boolean>;
  treeOpenMode: 'tab' | 'dialog';
  searchQuery?: string;
  openDocs: Doc[];
  activeTab: number;
  onToggleExpand: (id: string) => void;
  onPreview: (doc: Doc) => void;
  onTreeOpenModeChange: (mode: 'tab' | 'dialog') => void;
  onTabChange: (index: number) => void;
  onCloseTab: (index: number) => void;
}

function collectFolderIds(nodes: TreeNode[]): Record<string, boolean> {
  return nodes.reduce<Record<string, boolean>>((acc, node) => {
    if (node.type === 'folder') {
      acc[node.id] = true;
      Object.assign(acc, collectFolderIds(node.children));
    }
    return acc;
  }, {});
}

const TreeBrowser: React.FC<Props> = ({
  tree, docs, expanded, treeOpenMode, searchQuery = '', openDocs, activeTab,
  onToggleExpand, onPreview, onTreeOpenModeChange, onTabChange, onCloseTab,
}) => {
  const compact = useMediaQuery('(max-width: 900px)');

  const effectiveExpanded = searchQuery.trim()
    ? { ...collectFolderIds(tree), ...expanded }
    : expanded;

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: compact ? 'column' : 'row',
      gap: 2,
      // Fixed height on desktop so the panel doesn't grow with content
      height: compact ? 'auto' : '70vh',
      minHeight: compact ? 0 : 'unset',
    }}>
      <DocumentTree
        tree={tree}
        docs={docs}
        expanded={effectiveExpanded}
        treeOpenMode={treeOpenMode}
        searchQuery={searchQuery}
        onToggleExpand={onToggleExpand}
        onPreview={onPreview}
        onTreeOpenModeChange={onTreeOpenModeChange}
      />

      <Box sx={{
        flex: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        // Give the viewer a sensible height when stacked
        minHeight: compact ? 320 : 'unset',
      }}>
        <DocumentTabs
          openDocs={openDocs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onCloseTab={onCloseTab}
        />
      </Box>
    </Box>
  );
};

export default TreeBrowser;
