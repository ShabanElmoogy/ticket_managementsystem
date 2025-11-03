import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  InputAdornment,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
} from "@mui/material";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Description as DescriptionIcon,
  ExpandLess,
  ExpandMore,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import MyGridHeader from "../../common/MyGridHeader";
import DeleteConfirmDialog from "../../common/DeleteConfirmDialog";
import { useDocsBuilder } from "./hooks/useDocsBuilder";
import { useTheme } from "@mui/material/styles";
import type { Doc, DocBlock, TreeNode } from "./types";

interface DocsGalleryProps {
  onEditDoc?: (docId: string) => void;
  viewOnly?: boolean;
}

const DocsGallery: React.FC<DocsGalleryProps> = () => {
  const { docs, deleteDoc, tree, expanded, toggleExpand } = useDocsBuilder();
  const theme = useTheme();
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

  const renderTreeNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expanded[node.id];
    const paddingLeft = level * 24;

    if (node.type === 'folder') {
      return (
        <Box key={node.id}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                if (viewMode === 'tree') {
                  toggleExpand(node.id);
                } else {
                  // Navigate into folder
                  setCurrentPath([...currentPath, node.id]);
                }
              }}
              sx={{ pl: paddingLeft / 8 }}
            >
              <ListItemIcon>
                {isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
              </ListItemIcon>
              <ListItemText primary={node.title} />
              {viewMode === 'tree' && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          {viewMode === 'tree' && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {node.children.map((child) => renderTreeNode(child, level + 1))}
              </List>
            </Collapse>
          )}
        </Box>
      );
    } else {
      // Doc node
      const doc = docs.find((d) => d.id === node.docId);
      if (!doc) return null;

      return (
        <ListItem key={node.id} disablePadding>
          <ListItemButton sx={{ pl: paddingLeft / 8 }} onClick={() => handlePreview(doc)}>
            <ListItemIcon>
              <DescriptionIcon />
            </ListItemIcon>
            <ListItemText
              primary={doc.title}
              secondary={`Updated: ${new Date(doc.updatedAt).toLocaleDateString()}`}
            />
          </ListItemButton>
          <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>
            <IconButton size="small" onClick={() => handlePreview(doc)}>
              <VisibilityIcon />
            </IconButton>
          </Box>
        </ListItem>
      );
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

  const renderPreview = (blocks: DocBlock[]) => {
    if (!blocks || blocks.length === 0)
      return <Typography>No content</Typography>;

    return blocks.slice(0, 3).map((block, idx) => {
      switch (block.type) {
        case "heading":
          return (
            <Typography key={idx} variant="h6" sx={{ fontWeight: 700 }}>
              {block.text}
            </Typography>
          );
        case "text":
          return (
            <Typography
              key={idx}
              variant="body2"
              sx={{ whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{
                __html: block.html?.substring(0, 100) + "...",
              }}
            />
          );
        case "image":
          return block.url ? (
            <img
              key={idx}
              src={block.url}
              alt="preview"
              style={{ maxWidth: "100%", maxHeight: 100, objectFit: "cover" }}
            />
          ) : null;
        default:
          return (
            <Typography key={idx} variant="body2">
              {block.type}
            </Typography>
          );
      }
    });
  };

  const displayedItems = getItemsInCurrentPath();

  return (
    <Box sx={{ p: 3 }}>
      <MyGridHeader
        title="Document Gallery"
        icon={VisibilityIcon}
        rightActions={
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
        }
      />

      <Box sx={{ mb: 3 }}>
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
      </Box>

      {viewMode === 'tree' ? (
        <Box sx={{ display: 'flex', gap: 2, height: '70vh' }}>
          {/* Tree Panel */}
          <Box sx={{ width: 320, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Document Tree
              </Typography>
              <ToggleButtonGroup
                value={treeOpenMode}
                exclusive
                onChange={(_, newMode) => newMode && setTreeOpenMode(newMode)}
                size="small"
              >
                <ToggleButton value="tab">Tab</ToggleButton>
                <ToggleButton value="dialog">Dialog</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
              {tree.map((node) => renderTreeNode(node))}
            </List>
          </Box>

          {/* Content Panel */}
          <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {openDocs.length > 0 ? (
              <>
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }}
                >
                  {openDocs.map((doc, index) => (
                    <Tab
                      key={doc.id}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{doc.title}</span>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newDocs = openDocs.filter((_, i) => i !== index);
                              setOpenDocs(newDocs);
                              if (activeTab >= newDocs.length) {
                                setActiveTab(Math.max(0, newDocs.length - 1));
                              } else if (activeTab > index) {
                                setActiveTab(activeTab - 1);
                              }
                            }}
                            sx={{ ml: 0.5, p: 0.25 }}
                          >
                            ✕
                          </IconButton>
                        </Box>
                      }
                      sx={{ minHeight: 48, textTransform: 'none' }}
                    />
                  ))}
                </Tabs>
                <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
                  {(() => {
                    const currentDoc = openDocs[activeTab];
                    if (!currentDoc) return null;
                    return (
                      <>
                        <Typography variant="h5" gutterBottom>
                          {currentDoc.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Updated: {new Date(currentDoc.updatedAt).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          {currentDoc.blocks?.map((block: DocBlock) => (
                            <Box key={block.id} sx={{ mb: 2 }}>
                              {block.type === "heading" && (
                                <Typography variant="h5" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
                                  {block.text}
                                </Typography>
                              )}
                              {block.type === "text" && (
                                <Typography
                                  component="div"
                                  sx={{ whiteSpace: "pre-wrap", mb: 1 }}
                                  dangerouslySetInnerHTML={{ __html: block.html }}
                                />
                              )}
                              {block.type === "code" && (
                                <Box sx={{ textAlign: block.settings?.align || 'left' }}>
                                  {block.language && (
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                                      {block.language}
                                    </Typography>
                                  )}
                                  <SyntaxHighlighter
                                    language={block.language}
                                    style={vscDarkPlus}
                                    customStyle={{
                                      margin: 0,
                                      borderRadius: 8,
                                      padding: theme.spacing(2),
                                      fontSize: '0.875rem',
                                      textAlign: block.settings?.align || 'left',
                                    }}
                                  >
                                    {block.code}
                                  </SyntaxHighlighter>
                                </Box>
                              )}
                              {block.type === "bulletedList" && (
                                <Box sx={{ mb: 1 }}>
                                  {block.title && (
                                    <Typography
                                      variant="subtitle2"
                                      sx={{ fontWeight: 600, mb: 0.5 }}
                                    >
                                      {block.title}
                                    </Typography>
                                  )}
                                  <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
                                    {block.items
                                      .filter((item: string) => item)
                                      .map((item: string, idx: number) => (
                                        <li key={idx}>
                                          <Typography variant="body2">{item}</Typography>
                                        </li>
                                      ))}
                                  </ul>
                                </Box>
                              )}
                              {block.type === "divider" && (
                                <Box
                                  sx={{
                                    my: 1,
                                    borderBottom: `${
                                      block.settings?.dividerThickness || 1
                                    }px solid ${block.settings?.dividerColor || "#e0e0e0"}`,
                                  }}
                                />
                              )}
                              {block.type === "image" && block.url && (
                                <Box
                                  sx={{ mb: 1, textAlign: block.settings?.align || "center" }}
                                >
                                  <img
                                    src={block.url}
                                    alt={block.caption || "image"}
                                    style={{ maxWidth: "100%", borderRadius: 4 }}
                                  />
                                  {block.caption && (
                                    <Typography
                                      variant="caption"
                                      display="block"
                                      sx={{ mt: 0.5 }}
                                    >
                                      {block.caption}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              {block.type === "video" && block.url && (
                                <Box
                                  sx={{
                                    mb: 1,
                                    position: "relative",
                                    pt: "56.25%",
                                    borderRadius: 1,
                                    overflow: "hidden",
                                    bgcolor: "#000",
                                    maxWidth: 400,
                                    mx: "auto",
                                  }}
                                >
                                  <Box sx={{ position: "absolute", inset: 0 }}>
                                    {/youtu\.be|youtube\.com/.test(block.url) ? (
                                      <iframe
                                        title={block.caption || "video"}
                                        src={(() => {
                                          try {
                                            const url = new URL(block.url);
                                            const v = url.searchParams.get("v");
                                            if (v) return `https://www.youtube.com/embed/${v}`;
                                            const pathId = url.pathname
                                              .split("/")
                                              .filter((p: string) => p)[0];
                                            return `https://www.youtube.com/embed/${pathId}`;
                                          } catch {
                                            return block.url;
                                          }
                                        })()}
                                        width="100%"
                                        height="100%"
                                        frameBorder={0}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    ) : (
                                      <video
                                        src={block.url}
                                        controls
                                        style={{ width: "100%", height: "100%" }}
                                      />
                                    )}
                                  </Box>
                                  {block.caption && (
                                    <Typography
                                      variant="caption"
                                      display="block"
                                      sx={{ mt: 0.5 }}
                                    >
                                      {block.caption}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  Select a document from the tree to view its content
                </Typography>
              </Box>
            )}
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
                // It's a Doc
                const doc = item;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={doc.id}>
                    <Card
                      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {doc.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ mt: 1, maxHeight: 120, overflow: "hidden" }}>
                          {renderPreview(doc.blocks)}
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handlePreview(doc)}
                        >
                          Preview
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              } else {
                // It's a TreeNode (folder)
                const folder = item;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={folder.id}>
                    <Card
                      sx={{ height: "100%", display: "flex", flexDirection: "column", cursor: "pointer" }}
                      onClick={() => setCurrentPath([...currentPath, folder.id])}
                    >
                      <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <FolderIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h6">
                            {folder.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Folder
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
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

      {/* Preview Dialog - For card view and tree dialog mode */}
      {(viewMode === 'cards' || (viewMode === 'tree' && treeOpenMode === 'dialog')) && (
        <Dialog
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{previewDoc?.title}</DialogTitle>
          <DialogContent sx={{ maxHeight: "70vh", overflow: "auto" }}>
            {previewDoc?.blocks?.map((block: DocBlock) => (
              <Box key={block.id} sx={{ mb: 2 }}>
                {block.type === "heading" && (
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
                    {block.text}
                  </Typography>
                )}
                {block.type === "text" && (
                  <Typography
                    component="div"
                    sx={{ whiteSpace: "pre-wrap", mb: 1 }}
                    dangerouslySetInnerHTML={{ __html: block.html }}
                  />
                )}
                {block.type === "code" && (
                  <Box sx={{ textAlign: block.settings?.align || 'left' }}>
                    {block.language && (
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                        {block.language}
                      </Typography>
                    )}
                    <SyntaxHighlighter
                      language={block.language}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: 8,
                        padding: theme.spacing(2),
                        fontSize: '0.875rem',
                        textAlign: block.settings?.align || 'left',
                      }}
                    >
                      {block.code}
                    </SyntaxHighlighter>
                  </Box>
                )}
                {block.type === "bulletedList" && (
                  <Box sx={{ mb: 1 }}>
                    {block.title && (
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        {block.title}
                      </Typography>
                    )}
                    <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
                      {block.items
                        .filter((item: string) => item)
                        .map((item: string, idx: number) => (
                          <li key={idx}>
                            <Typography variant="body2">{item}</Typography>
                          </li>
                        ))}
                    </ul>
                  </Box>
                )}
                {block.type === "divider" && (
                  <Box
                    sx={{
                      my: 1,
                      borderBottom: `${
                        block.settings?.dividerThickness || 1
                      }px solid ${block.settings?.dividerColor || "#e0e0e0"}`,
                    }}
                  />
                )}
                {block.type === "image" && block.url && (
                  <Box
                    sx={{ mb: 1, textAlign: block.settings?.align || "center" }}
                  >
                    <img
                      src={block.url}
                      alt={block.caption || "image"}
                      style={{ maxWidth: "100%", borderRadius: 4 }}
                    />
                    {block.caption && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        {block.caption}
                      </Typography>
                    )}
                  </Box>
                )}
                {block.type === "video" && block.url && (
                  <Box
                    sx={{
                      mb: 1,
                      position: "relative",
                      pt: "56.25%",
                      borderRadius: 1,
                      overflow: "hidden",
                      bgcolor: "#000",
                      maxWidth: 400,
                      mx: "auto",
                    }}
                  >
                    <Box sx={{ position: "absolute", inset: 0 }}>
                      {/youtu\.be|youtube\.com/.test(block.url) ? (
                        <iframe
                          title={block.caption || "video"}
                          src={(() => {
                            try {
                              const url = new URL(block.url);
                              const v = url.searchParams.get("v");
                              if (v) return `https://www.youtube.com/embed/${v}`;
                              const pathId = url.pathname
                                .split("/")
                                .filter((p: string) => p)[0];
                              return `https://www.youtube.com/embed/${pathId}`;
                            } catch {
                              return block.url;
                            }
                          })()}
                          width="100%"
                          height="100%"
                          frameBorder={0}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={block.url}
                          controls
                          style={{ width: "100%", height: "100%" }}
                        />
                      )}
                    </Box>
                    {block.caption && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        {block.caption}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDoc(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

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
