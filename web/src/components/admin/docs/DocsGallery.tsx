import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import MyGridHeader from "../../common/MyGridHeader";
import DeleteConfirmDialog from "../../common/DeleteConfirmDialog";
import { useNavigate } from 'react-router-dom';
import { useDocsBuilder } from "./hooks/useDocsBuilder";
import {
  DocumentCard,
  FolderCard,
  DocumentTree,
  DocumentTabs,
  DocumentPreviewDialog,
} from "./gallery/components";
import type { Doc, TreeNode } from "./types";

interface DocsGalleryProps {
  onEditDoc?: (docId: string) => void;
  viewOnly?: boolean;
}

const DocsGallery: React.FC<DocsGalleryProps> = () => {
  const navigate = useNavigate();
  const { docs, deleteDoc, tree, expanded, toggleExpand } = useDocsBuilder();
  const [searchTerm, setSearchTerm] = useState("");
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; doc: Doc | null }>(
    { open: false, doc: null }
  );
  const [viewMode, setViewMode] = useState<'tree' | 'cards'>('tree');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [openDocs, setOpenDocs] = useState<Doc[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [treeOpenMode, setTreeOpenMode] = useState<'tab' | 'dialog'>('tab');

  const getCurrentNode = (): TreeNode | null => {
    if (currentPath.length === 0) return null; // root
    let current = tree.find(n => n.id === currentPath[0]);
    for (let i = 1; i < currentPath.length; i++) {
      if (current && current.type === 'folder') {
        current = current.children.find(c => c.id === currentPath[i]);
      } else {
        return null;
      }
    }
    return current || null;
  };

  const getItemsInCurrentPath = (): (TreeNode | Doc)[] => {
    if (currentPath.length === 0) {
      // Root: show all top-level folders and docs not in folders
      const topLevelFolders = tree.filter(n => n.type === 'folder');
      const docsNotInFolders = docs.filter(doc => {
        // Check if doc is not in any folder
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
      return [...topLevelFolders, ...docsNotInFolders];
    } else {
      const currentNode = getCurrentNode();
      if (!currentNode || currentNode.type !== 'folder') return [];
      return currentNode.children.map(child => {
        if (child.type === 'doc') {
          const doc = docs.find(d => d.id === child.docId);
          return doc || child;
        }
        return child;
      }).filter(Boolean);
    }
  };



  const handlePreview = (doc: Doc) => {
    if (viewMode === 'tree') {
      if (treeOpenMode === 'tab') {
        // Add doc to open docs if not already open
        setOpenDocs(prev => {
          const exists = prev.find(d => d.id === doc.id);
          if (!exists) {
            const newDocs = [...prev, doc];
            setActiveTab(newDocs.length - 1);
            return newDocs;
          } else {
            setActiveTab(prev.indexOf(exists));
            return prev;
          }
        });
      } else {
        setPreviewDoc(doc);
      }
    } else {
      setPreviewDoc(doc);
    }
  };

  const confirmDelete = async () => {
    if (deleteDialog.doc) {
      await deleteDoc(deleteDialog.doc.id);
      setDeleteDialog({ open: false, doc: null });
    }
  };



  const displayedItems = getItemsInCurrentPath();

  return (
    <Box sx={{ p: 3 }}>
      <MyGridHeader
        title="Document Gallery"
        icon={VisibilityIcon}
        leftActions={
          <Button
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard')}
            variant="outlined"
            size="small"
          >
            Home
          </Button>
        }
      />

      <Box sx={{ mb: 3, display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newView) => {
            if (newView) {
              setViewMode(newView);
              if (newView === 'tree') {
                setCurrentPath([]);
              }
            }
          }}
          sx={{ flexShrink: 0 }}
        >
          <ToggleButton value="tree">
            <ViewListIcon sx={{ mr: 1 }} />
            Tree View
          </ToggleButton>
          <ToggleButton value="cards">
            <ViewModuleIcon sx={{ mr: 1 }} />
            Card View
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {viewMode === 'tree' ? (
        <Box sx={{ display: 'flex', gap: 2, height: '70vh' }}>
          <DocumentTree
            tree={tree}
            docs={docs}
            expanded={expanded}
            treeOpenMode={treeOpenMode}
            onToggleExpand={toggleExpand}
            onPreview={handlePreview}
            onTreeOpenModeChange={setTreeOpenMode}
          />
          <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <DocumentTabs
              openDocs={openDocs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onCloseTab={(index) => {
                const newDocs = openDocs.filter((_, i) => i !== index);
                setOpenDocs(newDocs);
                if (activeTab >= newDocs.length) {
                  setActiveTab(Math.max(0, newDocs.length - 1));
                } else if (activeTab > index) {
                  setActiveTab(activeTab - 1);
                }
              }}
            />
          </Box>
        </Box>
      ) : (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            {currentPath.length > 0 && (
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  const newPath = [...currentPath];
                  newPath.pop();
                  setCurrentPath(newPath);
                }}
                sx={{ mr: 2 }}
              >
                Back
              </Button>
            )}
            <Typography variant="h6">
              {currentPath.length > 0
                ? `Documents in ${getCurrentNode()?.title || 'Folder'}`
                : 'All Documents'
              }
            </Typography>
            {currentPath.length > 0 && (
              <Button
                size="small"
                onClick={() => setCurrentPath([])}
                sx={{ ml: 'auto' }}
              >
                Show All
              </Button>
            )}
          </Box>

          <Grid container spacing={3}>
            {displayedItems.map((item) => {
              if ('blocks' in item) {
                return (
                  <DocumentCard
                    key={item.id}
                    doc={item}
                    onPreview={handlePreview}
                  />
                );
              } else {
                return (
                  <FolderCard
                    key={item.id}
                    folder={item}
                    onNavigate={(folderId) => setCurrentPath([...currentPath, folderId])}
                  />
                );
              }
            })}
          </Grid>

          {displayedItems.length === 0 && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: "center", mt: 6, py: 4 }}
            >
              {currentPath.length > 0 ? 'No items in this folder.' : 'No documents found.'}
            </Typography>
          )}
        </Box>
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
}

export default DocsGallery;
