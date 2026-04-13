import React, { useMemo, useState } from 'react';
import { Box, Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import MyGridHeader from '../../common/MyGridHeader';
import DeleteConfirmDialog from '../../common/DeleteConfirmDialog';
import { DocumentPreviewDialog } from './gallery/components';
import GalleryToolbar from './gallery/GalleryToolbar';
import CardsBrowser from './gallery/CardsBrowser';
import TreeBrowser from './gallery/TreeBrowser';
import { useDocsBuilder } from './hooks/useDocsBuilder';
import type { Doc, FolderNode, TreeNode } from './types';

interface DocsGalleryProps {
  onEditDoc?: (docId: string) => void;
  viewOnly?: boolean;
}

const DocsGallery: React.FC<DocsGalleryProps> = () => {
  const navigate = useNavigate();
  const { docs, deleteDoc, tree, expanded, toggleExpand } = useDocsBuilder();

  const [searchTerm, setSearchTerm]   = useState('');
  const [previewDoc, setPreviewDoc]   = useState<Doc | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; doc: Doc | null }>({ open: false, doc: null });
  const [viewMode, setViewMode]       = useState<'tree' | 'cards'>('tree');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [openDocs, setOpenDocs]       = useState<Doc[]>([]);
  const [activeTab, setActiveTab]     = useState(0);
  const [treeOpenMode, setTreeOpenMode] = useState<'tab' | 'dialog'>('tab');

  // ── Search helpers ──────────────────────────────────────────────────────────
  const query = searchTerm.trim().toLowerCase();

  /** Recursively filter a tree to only nodes whose docs match the query */
  const filterTree = (nodes: TreeNode[]): TreeNode[] => {
    if (!query) return nodes;
    return nodes.reduce<TreeNode[]>((acc, node) => {
      if (node.type === 'doc') {
        const doc = docs.find(d => d.id === node.docId);
        if (doc && doc.title.toLowerCase().includes(query)) acc.push(node);
      } else {
        const filteredChildren = filterTree(node.children);
        // Keep folder if it has matching descendants
        if (filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren } as FolderNode);
        }
      }
      return acc;
    }, []);
  };

  const filteredTree = useMemo(() => filterTree(tree), [tree, docs, query]);

  // ── Card-view navigation helpers ────────────────────────────────────────────
  const getCurrentNode = (): TreeNode | null => {
    if (currentPath.length === 0) return null;
    let current = tree.find(n => n.id === currentPath[0]);
    for (let i = 1; i < currentPath.length; i++) {
      if (current?.type === 'folder') {
        current = current.children.find(c => c.id === currentPath[i]);
      } else return null;
    }
    return current || null;
  };

  const getItemsInCurrentPath = (): (TreeNode | Doc)[] => {
    let items: (TreeNode | Doc)[];

    if (currentPath.length === 0) {
      const topLevelFolders = tree.filter(n => n.type === 'folder');
      const docsNotInFolders = docs.filter(doc => {
        const isInFolder = tree.some(node => {
          const findDoc = (n: TreeNode): boolean => {
            if (n.type === 'doc' && n.docId === doc.id) return true;
            if (n.type === 'folder') return n.children.some(findDoc);
            return false;
          };
          return findDoc(node);
        });
        return !isInFolder;
      });
      items = [...topLevelFolders, ...docsNotInFolders];
    } else {
      const currentNode = getCurrentNode();
      if (!currentNode || currentNode.type !== 'folder') return [];
      items = currentNode.children.map(child => {
        if (child.type === 'doc') return docs.find(d => d.id === child.docId) || child;
        return child;
      }).filter(Boolean) as (TreeNode | Doc)[];
    }

    if (!query) return items;

    // When searching in card view: show matching docs from ALL folders flat, ignore path
    if (currentPath.length === 0) {
      const matchingDocs = docs.filter(d => d.title.toLowerCase().includes(query));
      return matchingDocs;
    }

    // Inside a folder: filter docs by title, keep sub-folders that have matches
    return items.filter(item => {
      if ('blocks' in item) return item.title.toLowerCase().includes(query);
      // folder: keep if any descendant doc matches
      const hasMatch = (n: TreeNode): boolean => {
        if (n.type === 'doc') {
          const doc = docs.find(d => d.id === n.docId);
          return !!doc && doc.title.toLowerCase().includes(query);
        }
        return n.children.some(hasMatch);
      };
      return hasMatch(item as TreeNode);
    });
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handlePreview = (doc: Doc) => {
    if (viewMode === 'tree' && treeOpenMode === 'tab') {
      setOpenDocs(prev => {
        const exists = prev.find(d => d.id === doc.id);
        if (!exists) {
          const next = [...prev, doc];
          setActiveTab(next.length - 1);
          return next;
        }
        setActiveTab(prev.indexOf(exists));
        return prev;
      });
    } else {
      setPreviewDoc(doc);
    }
  };

  const handleCloseTab = (index: number) => {
    const next = openDocs.filter((_, i) => i !== index);
    setOpenDocs(next);
    if (activeTab >= next.length) setActiveTab(Math.max(0, next.length - 1));
    else if (activeTab > index) setActiveTab(activeTab - 1);
  };

  const handleViewModeChange = (mode: 'tree' | 'cards') => {
    setViewMode(mode);
    setSearchTerm('');
    if (mode === 'tree') setCurrentPath([]);
  };

  const confirmDelete = async () => {
    if (deleteDialog.doc) {
      await deleteDoc(deleteDialog.doc.id);
      setDeleteDialog({ open: false, doc: null });
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <MyGridHeader
        title="Document Gallery"
        icon={VisibilityIcon}
        leftActions={
          <Button startIcon={<HomeIcon />} onClick={() => navigate('/dashboard')} variant="outlined" size="small">
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Home</Box>
          </Button>
        }
      />

      <GalleryToolbar
        searchTerm={searchTerm}
        viewMode={viewMode}
        onSearchChange={setSearchTerm}
        onViewModeChange={handleViewModeChange}
      />

      {viewMode === 'tree' ? (
        <TreeBrowser
          tree={filteredTree}
          docs={docs}
          expanded={expanded}
          treeOpenMode={treeOpenMode}
          searchQuery={query}
          openDocs={openDocs}
          activeTab={activeTab}
          onToggleExpand={toggleExpand}
          onPreview={handlePreview}
          onTreeOpenModeChange={setTreeOpenMode}
          onTabChange={setActiveTab}
          onCloseTab={handleCloseTab}
        />
      ) : (
        <CardsBrowser
          items={getItemsInCurrentPath()}
          currentPath={currentPath}
          currentFolderTitle={getCurrentNode()?.title}
          searchQuery={query}
          onNavigateInto={(id) => setCurrentPath([...currentPath, id])}
          onNavigateBack={() => setCurrentPath(p => p.slice(0, -1))}
          onNavigateRoot={() => setCurrentPath([])}
          onPreview={handlePreview}
        />
      )}

      <DocumentPreviewDialog
        doc={previewDoc}
        open={(viewMode === 'cards' || (viewMode === 'tree' && treeOpenMode === 'dialog')) && !!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDialog.doc?.title}"?`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteDialog({ open: false, doc: null })}
      />
    </Box>
  );
};

export default DocsGallery;
