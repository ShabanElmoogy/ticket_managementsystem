import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, IconButton, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Alert, Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Label as TemplateIcon,
} from '@mui/icons-material';
import { templatesApi, type TemplatePayload } from './api/templates';
import type { TicketTemplate } from '../../../services/api/types';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', URGENT: '#dc2626',
};

const emptyForm = (): TemplatePayload => ({ name: '', description: '', priority: 'MEDIUM', estimatedHours: null });

const TemplatesManagement: React.FC = () => {
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TicketTemplate | null>(null);
  const [form, setForm] = useState<TemplatePayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TicketTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      setTemplates(await templatesApi.list());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (t: TicketTemplate) => {
    setEditing(t);
    setForm({ name: t.name, description: t.description ?? '', priority: t.priority, estimatedHours: t.estimatedHours ?? null });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await templatesApi.update(editing.id, form);
        setTemplates((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
      } else {
        const created = await templatesApi.create(form);
        setTemplates((prev) => [...prev, created]);
      }
      setDialogOpen(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await templatesApi.delete(deleteTarget.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <TemplateIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>Ticket Templates</Typography>
          <Chip label={templates.length} size="small" variant="outlined" />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          New Template
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : templates.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
          <TemplateIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No templates yet. Create one to speed up ticket creation.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2, borderRadius: 2 }}>
            Create First Template
          </Button>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {templates.map((t) => (
            <Paper key={t.id} variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Priority dot */}
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PRIORITY_COLORS[t.priority], flexShrink: 0 }} />

              {/* Info */}
              <Box flex={1} minWidth={0}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>{t.name}</Typography>
                {t.description && (
                  <Typography variant="caption" color="text.secondary" noWrap display="block">{t.description}</Typography>
                )}
                <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                  <Chip
                    label={t.priority}
                    size="small"
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700,
                      bgcolor: `${PRIORITY_COLORS[t.priority]}18`, color: PRIORITY_COLORS[t.priority],
                      border: `1px solid ${PRIORITY_COLORS[t.priority]}44` }}
                  />
                  {t.estimatedHours != null && (
                    <Chip label={`${t.estimatedHours}h est.`} size="small" variant="outlined"
                      sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                  <Chip label={`by ${t.createdBy?.name}`} size="small" variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }} />
                </Box>
              </Box>

              {/* Actions */}
              <Box display="flex" gap={0.5}>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => openEdit(t)}><EditIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(t)}><DeleteIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth disableScrollLock>
        <DialogTitle fontWeight={700}>{editing ? 'Edit Template' : 'New Template'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth autoFocus margin="normal" label="Template Name *"
            value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Bug Report, Feature Request"
          />
          <TextField
            fullWidth multiline minRows={3} margin="normal" label="Default Description"
            value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Pre-filled description for this ticket type..."
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Default Priority</InputLabel>
            <Select value={form.priority} label="Default Priority"
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as any }))}>
              {PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PRIORITY_COLORS[p] }} />
                    {p}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth margin="normal" type="number" label="Estimated Hours"
            inputProps={{ min: 0, step: 0.25 }}
            value={form.estimatedHours ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, estimatedHours: e.target.value === '' ? null : Number(e.target.value) }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editing ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth disableScrollLock>
        <DialogTitle fontWeight={700}>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplatesManagement;
