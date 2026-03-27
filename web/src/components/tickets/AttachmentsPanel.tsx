import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box, Typography, IconButton, Tooltip, CircularProgress,
  Chip, LinearProgress, Alert, Paper, Dialog, DialogContent,
  Fade, Backdrop, useTheme, useMediaQuery,
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
  Close as CloseIcon,
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

interface Props {
  ticketId: string;
  readonly?: boolean;
}

const MAX_SIZE_MB = 10;
const MAX_FILES = 5;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string) { return mime.startsWith('image/'); }
function isPdf(mime: string) { return mime === 'application/pdf'; }
function isVideo(mime: string) { return mime.startsWith('video/'); }
function isText(mime: string) { return mime.startsWith('text/') || mime === 'application/json'; }

function getFileIcon(mime: string, size = 'small' as 'small' | 'medium' | 'large') {
  if (isImage(mime)) return <ImageIcon fontSize={size} sx={{ color: '#3b82f6' }} />;
  if (isPdf(mime))   return <PdfIcon   fontSize={size} sx={{ color: '#ef4444' }} />;
  if (isVideo(mime)) return <VideoIcon  fontSize={size} sx={{ color: '#8b5cf6' }} />;
  if (mime.includes('word') || mime.includes('document')) return <DocIcon fontSize={size} sx={{ color: '#0ea5e9' }} />;
  return <FileIcon fontSize={size} sx={{ color: '#6b7280' }} />;
}

function getFileBg(mime: string) {
  if (isImage(mime)) return 'rgba(59,130,246,0.08)';
  if (isPdf(mime))   return 'rgba(239,68,68,0.08)';
  if (isVideo(mime)) return 'rgba(139,92,246,0.08)';
  return 'rgba(107,114,128,0.08)';
}

// ── Viewer ────────────────────────────────────────────────────────────────────
interface ViewerProps {
  attachments: Attachment[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}

const FileViewer: React.FC<ViewerProps> = ({ attachments, index, onClose, onNavigate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const a = attachments[index];
  const [zoom, setZoom] = useState(1);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  // Reset zoom when attachment changes
  useEffect(() => { setZoom(1); setTextContent(null); }, [index]);

  // Load text files
  useEffect(() => {
    if (!isText(a.mimeType)) return;
    setTextLoading(true);
    fetch(a.url)
      .then((r) => r.text())
      .then(setTextContent)
      .catch(() => setTextContent('Failed to load file content.'))
      .finally(() => setTextLoading(false));
  }, [a.url, a.mimeType]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
    if (e.key === 'ArrowRight' && index < attachments.length - 1) onNavigate(index + 1);
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 4));
    if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 0.25));
  }, [index, attachments.length, onNavigate, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderContent = () => {
    if (isImage(a.mimeType)) {
      return (
        <Box
          sx={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'auto', cursor: zoom > 1 ? 'grab' : 'default',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box
            component="img"
            src={a.url}
            alt={a.originalName}
            sx={{
              maxWidth: zoom === 1 ? '100%' : 'none',
              maxHeight: zoom === 1 ? '100%' : 'none',
              width: zoom !== 1 ? `${zoom * 100}%` : 'auto',
              objectFit: 'contain',
              borderRadius: 1,
              transition: 'transform 0.2s',
              userSelect: 'none',
            }}
          />
        </Box>
      );
    }

    if (isPdf(a.mimeType)) {
      return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
          <Box
            component="iframe"
            src={`${a.url}#toolbar=1&navpanes=0`}
            title={a.originalName}
            sx={{ flex: 1, border: 'none', borderRadius: 1, minHeight: 0 }}
          />
        </Box>
      );
    }

    if (isVideo(a.mimeType)) {
      return (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
          <Box
            component="video"
            src={a.url}
            controls
            autoPlay={false}
            sx={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 2 }}
          />
        </Box>
      );
    }

    if (isText(a.mimeType)) {
      return (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }} onClick={(e) => e.stopPropagation()}>
          {textLoading ? (
            <Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box>
          ) : (
            <Box
              component="pre"
              sx={{
                m: 0, fontFamily: 'monospace', fontSize: '0.85rem',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                color: 'text.primary', lineHeight: 1.7,
              }}
            >
              {textContent}
            </Box>
          )}
        </Box>
      );
    }

    // Unsupported — show download prompt
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Box sx={{ p: 3, borderRadius: '50%', bgcolor: getFileBg(a.mimeType) }}>
          {getFileIcon(a.mimeType, 'large')}
        </Box>
        <Typography variant="h6" fontWeight={600}>{a.originalName}</Typography>
        <Typography variant="body2" color="text.secondary">
          Preview not available for this file type
        </Typography>
        <Box
          component="a"
          href={a.url}
          download={a.originalName}
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            px: 3, py: 1.5, borderRadius: 2,
            bgcolor: 'primary.main', color: '#fff',
            textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          <DownloadIcon fontSize="small" />
          Download File
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          bgcolor: (t) => t.palette.mode === 'dark' ? '#0a0f1e' : '#1a1a2e',
          display: 'flex', flexDirection: 'column',
        },
      }}
    >
      {/* ── Toolbar ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: 2, py: 1, flexShrink: 0,
        bgcolor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* File info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
          <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: getFileBg(a.mimeType), flexShrink: 0 }}>
            {getFileIcon(a.mimeType)}
          </Box>
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#fff' }}>
              {a.originalName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              {formatBytes(a.size)} · {a.uploadedBy?.name}
              {attachments.length > 1 && ` · ${index + 1} / ${attachments.length}`}
            </Typography>
          </Box>
        </Box>

        {/* Zoom controls — images only */}
        {isImage(a.mimeType) && !isMobile && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title="Zoom out (-)">
              <IconButton size="small" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Chip
              label={`${Math.round(zoom * 100)}%`}
              size="small"
              onClick={() => setZoom(1)}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem' }}
            />
            <Tooltip title="Zoom in (+)">
              <IconButton size="small" onClick={() => setZoom((z) => Math.min(z + 0.25, 4))} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fit to screen (0)">
              <IconButton size="small" onClick={() => setZoom(1)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                <FitIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Download + open in new tab + close */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <Tooltip title="Open in new tab">
            <IconButton size="small" component="a" href={a.url} target="_blank" rel="noopener" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" component="a" href={a.url} download={a.originalName} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close (Esc)">
            <IconButton size="small" onClick={onClose} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Content ── */}
      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, minHeight: 0, position: 'relative' }}>
        {renderContent()}

        {/* Prev / Next navigation */}
        {attachments.length > 1 && (
          <>
            <IconButton
              onClick={() => onNavigate(index - 1)}
              disabled={index === 0}
              sx={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)', color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                '&.Mui-disabled': { opacity: 0.2 },
              }}
            >
              <PrevIcon />
            </IconButton>
            <IconButton
              onClick={() => onNavigate(index + 1)}
              disabled={index === attachments.length - 1}
              sx={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)', color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                '&.Mui-disabled': { opacity: 0.2 },
              }}
            >
              <NextIcon />
            </IconButton>
          </>
        )}
      </DialogContent>

      {/* ── Thumbnail strip ── */}
      {attachments.length > 1 && (
        <Box sx={{
          display: 'flex', gap: 1, px: 2, py: 1.5, flexShrink: 0,
          bgcolor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          overflowX: 'auto',
        }}>
          {attachments.map((att, i) => (
            <Box
              key={att.id}
              onClick={() => onNavigate(i)}
              sx={{
                width: 52, height: 52, flexShrink: 0, borderRadius: 1.5,
                overflow: 'hidden', cursor: 'pointer',
                border: '2px solid',
                borderColor: i === index ? 'primary.main' : 'rgba(255,255,255,0.15)',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: 'primary.light' },
              }}
            >
              {isImage(att.mimeType) ? (
                <Box component="img" src={att.url} alt={att.originalName}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: getFileBg(att.mimeType) }}>
                  {getFileIcon(att.mimeType)}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Dialog>
  );
};

// ── Main panel ────────────────────────────────────────────────────────────────
const AttachmentsPanel: React.FC<Props> = ({ ticketId, readonly = false }) => {
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  useEffect(() => { fetchAttachments(); }, [ticketId]);

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
      setUploadProgress(100);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Upload failed');
    } finally {
      clearInterval(interval);
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 600);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    setDeletingId(attachment.id);
    try {
      await attachmentsApi.deleteAttachment(ticketId, attachment.id);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch {
      setError('Failed to delete attachment');
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (a: Attachment) => isAdmin || a.uploadedBy?.id === user?.id;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <AttachIcon fontSize="small" color="action" />
        <Typography variant="subtitle2" fontWeight={700}>Attachments</Typography>
        <Chip label={attachments.length} size="small" variant="outlined" />
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
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
            p: 2.5, mb: 3, textAlign: 'center', cursor: uploading ? 'default' : 'pointer',
            borderStyle: 'dashed', borderWidth: 2,
            borderColor: dragOver ? 'primary.main' : 'divider',
            borderRadius: 3,
            bgcolor: dragOver
              ? (t) => t.palette.mode === 'dark' ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.04)'
              : 'background.default',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(59,130,246,0.06)' : 'rgba(37,99,235,0.03)',
            },
          }}
        >
          <input ref={inputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          {uploading ? (
            <Box>
              <CircularProgress size={24} sx={{ mb: 1 }} />
              <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 2, height: 6, mb: 0.5 }} />
              <Typography variant="caption" color="text.secondary">Uploading...</Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" gap={0.75}>
              <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'action.hover' }}>
                <UploadIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              </Box>
              <Typography variant="body2" fontWeight={500}>
                Drop files here or <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>click to browse</Box>
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Max {MAX_FILES} files · {MAX_SIZE_MB} MB each · Images, PDF, Video, Docs
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
      ) : attachments.length === 0 ? (
        <Box textAlign="center" py={6}>
          <AttachIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">No attachments yet</Typography>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={1}>
          {attachments.map((a, i) => (
            <Paper
              key={a.id}
              variant="outlined"
              sx={{
                p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
                borderRadius: 2, cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(59,130,246,0.06)' : 'rgba(37,99,235,0.03)',
                  transform: 'translateX(2px)',
                },
              }}
              onClick={() => setViewerIndex(i)}
            >
              {/* Thumbnail or icon */}
              <Box sx={{
                width: 48, height: 48, flexShrink: 0, borderRadius: 1.5,
                overflow: 'hidden', bgcolor: getFileBg(a.mimeType),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isImage(a.mimeType) ? (
                  <Box component="img" src={a.url} alt={a.originalName}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getFileIcon(a.mimeType, 'medium')
                )}
              </Box>

              {/* Info */}
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ '&:hover': { color: 'primary.main' } }}>
                  {a.originalName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(a.size)} · {a.uploadedBy?.name}
                </Typography>
              </Box>

              {/* Type badge */}
              <Chip
                label={a.mimeType.split('/')[1]?.toUpperCase().slice(0, 6) ?? 'FILE'}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: getFileBg(a.mimeType), flexShrink: 0 }}
              />

              {/* Actions — stop propagation so row click doesn't open viewer */}
              <Box display="flex" gap={0.5} onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Download">
                  <IconButton size="small" component="a" href={a.url} download={a.originalName}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {canDelete(a) && (
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(a)} disabled={deletingId === a.id}>
                      {deletingId === a.id ? <CircularProgress size={14} /> : <DeleteIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Viewer */}
      {viewerIndex !== null && (
        <FileViewer
          attachments={attachments}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </Box>
  );
};

export default AttachmentsPanel;
