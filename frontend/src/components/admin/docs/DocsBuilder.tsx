import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
  Button,
  IconButton,
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
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TitleIcon from '@mui/icons-material/Title';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CodeIcon from '@mui/icons-material/Code';
import NotesIcon from '@mui/icons-material/Notes';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import MyGridHeader from '../../common/MyGridHeader';

// Types and constants
import type { BlockType, TreeNode, HeadingBlock, TextBlock, BulletedListBlock, ImageBlock, VideoBlock, CodeBlock } from './types';
import { findNode } from './utils/treeUtils';

// Sidebar palette item definition
const palette: { type: BlockType; label: string; description: string; icon: React.ReactNode }[] = [
  { type: 'heading', label: 'Heading', description: 'Large section heading', icon: <TitleIcon /> },
  { type: 'text', label: 'Text', description: 'Rich text paragraph', icon: <TextFieldsIcon /> },
  { type: 'code', label: 'Code', description: 'Code snippet with syntax highlighting', icon: <CodeIcon /> },
  { type: 'divider', label: 'Divider', description: 'Horizontal separator', icon: <HorizontalRuleIcon /> },
  { type: 'image', label: 'Image', description: 'Image by URL', icon: <ImageIcon /> },
  { type: 'bulletedList', label: 'Bulleted List', description: 'List of bullet points', icon: <FormatListBulletedIcon /> },
  { type: 'video', label: 'Video', description: 'Video embed URL (YouTube, etc.)', icon: <MovieIcon /> },
];

// Components
import BlockContainer from './components/BlockContainer';
import BlockSettingsBar from './components/BlockSettingsBar';
import { HeadingBlockEditor, TextBlockEditor, CodeBlockEditor, BulletedListEditor, DividerBlockView, ImageBlockEditor, VideoBlockEditor } from './components/blockEditors';

// Hook
import { useDocsBuilder } from './hooks/useDocsBuilder';

// Main builder component
const DocsBuilder: React.FC = () => {
  const theme = useTheme();
  const {
    docs,
    currentDocId,
    setCurrentDocId,
    currentDoc,
    preview,
    setPreview,
    tree,
    selectedTreeId,
    setSelectedTreeId,
    expanded,
    addBlock,
    updateBlock,
    updateBlockSettings,
    removeBlock,
    moveBlock,
    dndHandlers,
    addFolder,
    addDocUnder,
    renameNode,
    deleteNodeAndDocs,
    toggleExpand,
    saveCurrentDoc,
    resetCurrent,
  } = useDocsBuilder();

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
      <MyGridHeader title="Documentation Builder" icon={TextFieldsIcon} rightActions={rightActions} />

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
                {block.type === 'code' && (
                  <Box sx={{ textAlign: block.settings?.align || 'left' }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                      {(block as CodeBlock).language}
                    </Typography>
                    <SyntaxHighlighter
                      language={(block as CodeBlock).language}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        borderRadius: 8,
                        padding: theme.spacing(2),
                        fontSize: '0.875rem',
                        textAlign: block.settings?.align || 'left',
                      }}
                    >
                      {(block as CodeBlock).code}
                    </SyntaxHighlighter>
                  </Box>
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

            {(() => {
              console.log('currentDoc:', currentDoc);
              console.log('currentDoc.blocks:', currentDoc?.blocks);
              console.log('blocks type:', typeof currentDoc?.blocks);
              return currentDoc?.blocks && Array.isArray(currentDoc.blocks) && currentDoc.blocks.map((block, idx) => {
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
                case 'code':
                  return (
                    <BlockContainer key={block.id} {...commonActions} draggable dragHandlers={dragHandlers}>
                      <CodeBlockEditor
                        block={block as CodeBlock}
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
            });
            })()}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DocsBuilder;
