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
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Description as DescriptionIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import MyGridHeader from "../../common/MyGridHeader";
import DeleteConfirmDialog from "../../common/DeleteConfirmDialog";
import { useDocsBuilder } from "./hooks/useDocsBuilder";
import type { Doc, DocBlock, TreeNode } from "./types";

interface DocsGalleryProps {
  onEditDoc?: (docId: string) => void;
}

const DocsGallery: React.FC<DocsGalleryProps> = ({ onEditDoc }) => {
  const { docs, deleteDoc, setCurrentDocId, tree, expanded, toggleExpand } = useDocsBuilder();
  const [searchTerm, setSearchTerm] = useState("");
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; doc: Doc | null }>(
    { open: false, doc: null }
  );

  const filteredDocs = docs.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderTreeNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isExpanded = expanded[node.id];
    const paddingLeft = level * 24;

    if (node.type === 'folder') {
      return (
        <Box key={node.id}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => toggleExpand(node.id)} sx={{ pl: paddingLeft / 8 }}>
              <ListItemIcon>
                {isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
              </ListItemIcon>
              <ListItemText primary={node.title} />
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
            <IconButton size="small" onClick={() => handleEdit(doc.id)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(doc)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </ListItem>
      );
    }
  };

  const handlePreview = (doc: Doc) => {
    setPreviewDoc(doc);
  };

  const handleEdit = (docId: string) => {
    setCurrentDocId(docId);
    // Call parent callback if provided, otherwise set current doc
    if (onEditDoc) {
      onEditDoc(docId);
    }
  };

  const handleDelete = (doc: Doc) => {
    setDeleteDialog({ open: true, doc });
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

  return (
    <Box>
      <MyGridHeader title="Document Gallery" icon={VisibilityIcon} />

      <Box sx={{ mb: 2 }}>
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

      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Tree View */}
        <Box sx={{ flex: 1, maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Document Tree
          </Typography>
          <List>
            {tree.map((node) => renderTreeNode(node))}
          </List>
        </Box>

        {/* Gallery View */}
        <Box sx={{ flex: 2 }}>
          <Typography variant="h6" gutterBottom>
            Document Gallery
          </Typography>
          <Grid container spacing={2}>
            {filteredDocs.map((doc) => (
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
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(doc.id)}
                    >
                      Edit
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(doc)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {filteredDocs.length === 0 && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: "center", mt: 4 }}
            >
              No documents found.
            </Typography>
          )}
        </Box>
      </Box>

      {/* Preview Dialog */}
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
                <Box
                  sx={{
                    mb: 1,
                    p: 1,
                    bgcolor: "#f5f5f5",
                    borderRadius: 1,
                    overflow: "auto",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: "text.secondary" }}
                  >
                    {block.language}
                  </Typography>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                    }}
                  >
                    {block.code}
                  </pre>
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
          <Button
            variant="contained"
            onClick={() => {
              if (previewDoc) {
                handleEdit(previewDoc.id);
                setPreviewDoc(null);
              }
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

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
