import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box, Typography, IconButton, Tooltip, CircularProgress,
  Chip, LinearProgress, Alert, Paper, useTheme, useMediaQuery, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
} from '@mui/material';
import {
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  InsertDriveFile as FileIcon,
  CloudUpload as UploadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ZoomOutMap as FitIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Videocam as VideoIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { attachmentsApi } from './api/attachments';
import type { Attachment } from '../../services/api/types';
import { useAuthStore } from '../../stores/authStore';

interface Props { ticketId: string; readonly?: boolean; }

const MAX_SIZE_MB = 10;
const MAX_FILES = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
function isImage(m: string) { return m.startsWith('image/'); }
function isPdf(m: string)   { return m === 'application/pdf'; }
function isVideo(m: string) { return m.startsWith('video/'); }
function isText(m: string)  { return m.startsWith('text/') || m === 'application/json'; }

function getFileBg(m: string) {
  if (isImage(m)) return 'rgba(59,130,246,0.10)';
  if (isPdf(m))   return 'rgba(239,68,68,0.10)';
  if (isVideo(m)) return 'rgba(139,92,246,0.10)';
  return 'rgba(107,114,128,0.10)';
}
function getFileColor(m: string) {
  if (isImage(m)) return '#3b82f6';
  if (isPdf(m))   return '#ef4444';
  if (isVideo(m)) return '#8b5cf6';
  if (m.includes('word') || m.includes('document')) return '#0ea5e9';
  return '#6b7280';
}
function getFileIcon(m: string, size: 'small' | 'medium' | 'large' = 'small') {
  const c = getFileColor(m);
  if (isImage(m)) return <ImageIcon fontSize={size} sx={{ color: c }} />;
  if (isPdf(m))   return <PdfIcon   fontSize={size} sx={{ color: c }} />;
  if (isVideo(m)) return <VideoIcon  fontSize={size} sx={{ color: c }} />;
  if (m.includes('word') || m.includes('document')) return <DocIcon fontSize={size} sx={{ color: c }} />;
  return <FileIcon fontSize={size} sx={{ color: c }} />;
}
function getExt(m: string) {
  return m.split('/')[1]?.toUpperCase().slice(0, 6) ?? 'FILE';
}

// ── Inline viewer pane ────────────────────────────────────────────────────────
interface ViewerPaneProps {
  attachments: Attachment[];
  index: number;
  onNavigate: (i: number) => void;
}

const ViewerPane: React.FC<ViewerPaneProps> = ({ attachments, index, onNavigate }) => {
  const a = attachments[index];
  const [zoom, setZoom] = useState(1);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => { setZoom(1); setTextContent(null); }, [index]);

  useEffect(() => {
    if (!isText(a.mimeType)) return;
    setTextLoading(true);
    fetch(a.url)
      .then((r) => r.text())
      .then(setTextContent)
      .catch(() => setTextContent('Failed to load file content.'))
      .finally(() => setTextLoading(false));
  }, [a.url, a.mimeType]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp'   && index > 0)                    onNavigate(index - 1);
    if (e.key === 'ArrowDown' && index < attachments.length - 1) onNavigate(index + 1);
    if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 4));
    if (e.key === '-')                  setZoom((z) => Math.max(z - 0.25, 0.25));
  }, [index, attachments.length, onNavigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const renderContent = () => {
    if (isImage(a.mimeType)) return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', p: 2 }}>
        <Box
          component="img"
          src={a.url}
          alt={a.originalName}
          sx={{
            maxWidth: zoom === 1 ? '100%' : 'none',
            maxHeight: zoom === 1 ? '100%' : 'none',
            width: zoom !== 1 ? `${zoom * 100}%` : 'auto',
            objectFit: 'contain',
            borderRadius: 2,
            boxShadow: 4,
            userSelect: 'none',
            transition: 'width 0.15s',
          }}
        />
      </Box>
    );

    if (isPdf(a.mimeType)) return (
      <Box component="iframe"
        src={`${a.url}#toolbar=1&navpanes=0`}
        title={a.originalName}
        sx={{ flex: 1, border: 'none', minHeight: 0 }}
      />
    );

    if (isVideo(a.mimeType)) return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, overflow: 'hidden', minWidth: 0 }}>
        <Box component="video" src={a.url} controls
          sx={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 2, boxShadow: 4, display: 'block' }} />
      </Box>
    );

    if (isText(a.mimeType)) return (
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {textLoading
          ? <Box display="flex" justifyContent="center" pt={6}><CircularProgress /></Box>
          : <Box component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 }}>
              {textContent}
            </Box>
        }
      </Box>
    );

    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 4 }}>
        <Box sx={{ p: 3, borderRadius: '50%', bgcolor: getFileBg(a.mimeType) }}>
          {getFileIcon(a.mimeType, 'large')}
        </Box>
        <Typography variant="h6" fontWeight={600} textAlign="center">{a.originalName}</Typography>
        <Typography variant="body2" color="text.secondary">Preview not available for this file type</Typography>
        <Box component="a" href={a.url} download={a.originalName}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 3, py: 1.5, borderRadius: 2,
            bgcolor: 'primary.main', color: '#fff', textDecoration: 'none', fontWeight: 600,
            '&:hover': { bgcolor: 'primary.dark' } }}>
          <DownloadIcon fontSize="small" /> Download File
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>

      {/* Viewer toolbar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, flexShrink: 0,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      }}>
        {/* File info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: getFileBg(a.mimeType), flexShrink: 0 }}>
            {getFileIcon(a.mimeType)}
          </Box>
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap>{a.originalName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatBytes(a.size)} · {a.uploadedBy?.name}
              {attachments.length > 1 && ` · ${index + 1} / ${attachments.length}`}
            </Typography>
          </Box>
        </Box>

        {/* Zoom — images only */}
        {isImage(a.mimeType) && (
          <Box display="flex" alignItems="center" gap={0.25}>
            <Tooltip title="Zoom out (-)">
              <IconButton size="small" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Chip label={`${Math.round(zoom * 100)}%`} size="small" onClick={() => setZoom(1)}
              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', minWidth: 48 }} />
            <Tooltip title="Zoom in (+)">
              <IconButton size="small" onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fit">
              <IconButton size="small" onClick={() => setZoom(1)}>
                <FitIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Nav arrows */}
        {attachments.length > 1 && (
          <Box display="flex" gap={0.25}>
            <Tooltip title="Previous (↑)">
              <span>
                <IconButton size="small" onClick={() => onNavigate(index - 1)} disabled={index === 0}>
                  <PrevIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Next (↓)">
              <span>
                <IconButton size="small" onClick={() => onNavigate(index + 1)} disabled={index === attachments.length - 1}>
                  <NextIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}

        {/* Open + download */}
        <Tooltip title="Open in new tab">
          <IconButton size="small" component="a" href={a.url} target="_blank" rel="noopener">
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download">
          <IconButton size="small" component="a" href={a.url} download={a.originalName}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', minWidth: 0 }}>
        {renderContent()}
      </Box>
    </Box>
  );
};

// ── Main panel ────────────────────────────────────────────────────────────────
const AttachmentsPanel: React.FC<Props> = ({ ticketId, readonly = false }) => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const inputRef = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ attachment: Attachment; index: number } | null>(null);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  useEffect(() => { fetchAttachments(); }, [ticketId]);

  // Auto-select first attachment when list loads
  useEffect(() => {
    if (attachments.length > 0 && selectedIndex === null) setSelectedIndex(0);
    if (attachments.length === 0) setSelectedIndex(null);
  }, [attachments]);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const data = await attachmentsApi.getAttachments(ticketId);
      setAttachments(data);
    } catch {
      setError('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const fileArr = Array.from(files).slice(0, MAX_FILES);
    const oversized = fileArr.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`Files must be under ${MAX_SIZE_MB} MB: ${oversized.map((f) => f.name).join(', ')}`);
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => setUploadProgress((p) => Math.min(p + 15, 85)), 200);
    try {
      const uploaded = await attachmentsApi.uploadAttachments(ticketId, fileArr);
      setAttachments((prev) => [...prev, ...uploaded]);
      setSelectedIndex(attachments.length); // select first new file
      setUploadProgress(100);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Upload failed');
    } finally {
      clearInterval(interval);
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 600);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (a: Attachment, i: number) => {
    setDeletingId(a.id);
    try {
      await attachmentsApi.deleteAttachment(ticketId, a.id);
      const next = attachments.filter((_, idx) => idx !== i);
      setAttachments(next);
      if (selectedIndex === i) setSelectedIndex(next.length > 0 ? Math.min(i, next.length - 1) : null);
    } catch {
      setError('Failed to delete attachment');
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (a: Attachment) => isAdmin || a.uploadedBy?.id === user?.id;

  // ── Left panel: list + upload ──────────────────────────────────────────────
  const listPanel = (
    <Box sx={{
      width: isMobile ? '100%' : 300,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRight: isMobile ? 'none' : '1px solid',
      borderBottom: isMobile ? '1px solid' : 'none',
      borderColor: 'divider',
      minHeight: 0,
    }}>
      {/* List header */}
      <Box sx={{
        px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0,
        borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      }}>
        <AttachIcon fontSize="small" color="action" />
        <Typography variant="subtitle2" fontWeight={700} flex={1}>Files</Typography>
        <Chip label={attachments.length} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mx: 1.5, mt: 1.5, py: 0.5 }}>
          {error}
        </Alert>
      )}

      {/* Upload zone */}
      {!readonly && (
        <Paper
          variant="outlined"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !uploading && inputRef.current?.click()}
          sx={{
            mx: 1.5, mt: 1.5, p: 1.5, textAlign: 'center',
            cursor: uploading ? 'default' : 'pointer',
            borderStyle: 'dashed', borderWidth: 2, borderRadius: 2,
            borderColor: dragOver ? 'primary.main' : 'divider',
            bgcolor: dragOver
              ? (t) => t.palette.mode === 'dark' ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.04)'
              : 'transparent',
            transition: 'all 0.2s',
            flexShrink: 0,
            '&:hover': { borderColor: 'primary.main', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(59,130,246,0.06)' : 'rgba(37,99,235,0.03)' },
          }}
        >
          <input ref={inputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          {uploading ? (
            <Box>
              <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 2, height: 4, mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary">Uploading...</Typography>
            </Box>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              <UploadIcon sx={{ color: 'primary.main', fontSize: 18 }} />
              <Typography variant="caption" fontWeight={500}>
                Drop or <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>browse</Box>
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* File list */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={20} /></Box>
        ) : attachments.length === 0 ? (
          <Box textAlign="center" py={4}>
            <AttachIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
            <Typography variant="caption" color="text.secondary" display="block">No files yet</Typography>
          </Box>
        ) : (
          attachments.map((a, i) => {
            const selected = selectedIndex === i;
            return (
              <Box
                key={a.id}
                onClick={() => setSelectedIndex(i)}
                sx={{
                  mx: 1, mb: 0.5, px: 1.5, py: 1,
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  borderRadius: 2, cursor: 'pointer',
                  bgcolor: selected
                    ? (t) => t.palette.mode === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.08)'
                    : 'transparent',
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'transparent',
                  transition: 'all 0.15s',
                  '&:hover': {
                    bgcolor: selected
                      ? undefined
                      : (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  },
                }}
              >
                {/* Thumbnail */}
                <Box sx={{
                  width: 36, height: 36, flexShrink: 0, borderRadius: 1.5,
                  overflow: 'hidden', bgcolor: getFileBg(a.mimeType),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isImage(a.mimeType)
                    ? <Box component="img" src={a.url} alt={a.originalName} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : getFileIcon(a.mimeType)
                  }
                </Box>

                {/* Info */}
                <Box flex={1} minWidth={0}>
                  <Typography variant="caption" fontWeight={selected ? 700 : 500} noWrap display="block"
                    sx={{ color: selected ? 'primary.main' : 'text.primary' }}>
                    {a.originalName}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                    {formatBytes(a.size)}
                  </Typography>
                </Box>

                {/* Actions */}
                <Box display="flex" onClick={(e) => e.stopPropagation()}>
                  {canDelete(a) && (
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error"
                        onClick={() => setConfirmDelete({ attachment: a, index: i })}
                        sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );

  // ── Right panel: viewer ────────────────────────────────────────────────────
  const viewerPanel = (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      {selectedIndex !== null && attachments[selectedIndex] ? (
        <ViewerPane
          attachments={attachments}
          index={selectedIndex}
          onNavigate={setSelectedIndex}
        />
      ) : (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, opacity: 0.5 }}>
          <AttachIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">
            {attachments.length === 0 ? 'No files attached' : 'Select a file to preview'}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        borderRadius: 3,
        overflow: 'hidden',
        height: isMobile ? 'auto' : '100%',
        minHeight: isMobile ? 400 : 0,
        flex: isMobile ? undefined : 1,
      }}
    >
      {listPanel}
      {viewerPanel}

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth disableScrollLock>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Attachment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{confirmDelete?.attachment.originalName}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} disabled={!!deletingId}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!!deletingId}
            onClick={async () => {
              if (!confirmDelete) return;
              await handleDelete(confirmDelete.attachment, confirmDelete.index);
              setConfirmDelete(null);
            }}
          >
            {deletingId ? <CircularProgress size={16} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AttachmentsPanel;
