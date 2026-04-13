import React from 'react';
import {
  Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Button, TextField, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Snackbar,
} from '@mui/material';
import { Label as TemplateIcon } from '@mui/icons-material';
import { useIsAdmin } from '../../../../stores/authStore';
import { DeleteConfirmDialog } from '../../../common';
import TemplatePageLayout, { type TemplateItem } from './TemplatePageLayout';
import { useTicketTemplates } from '../hooks/useTicketTemplates';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', URGENT: '#dc2626',
};

const TicketTemplatesTab: React.FC = () => {
  const isAdmin = useIsAdmin();
  const {
    templates, loading,
    dialogOpen, editing, form, setForm, saving, nameRef,
    deleteTarget, deleting, snack,
    openCreate, openEdit, handleSave, handleDelete,
    setDialogOpen, setDeleteTarget, setSnack,
  } = useTicketTemplates();

  const items: TemplateItem[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    meta: (
      <>
        <Chip
          label={t.priority}
          size="small"
          sx={{
            height: 18, fontSize: '0.65rem', fontWeight: 700,
            bgcolor: `${PRIORITY_COLORS[t.priority]}18`,
            color: PRIORITY_COLORS[t.priority],
            border: `1px solid ${PRIORITY_COLORS[t.priority]}44`,
          }}
        />
        {t.estimatedHours != null && (
          <Chip label={`${t.estimatedHours}h est.`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
        )}
        <Chip label={`by ${t.createdBy?.name}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
      </>
    ),
  }));

  return (
    <>
      <TemplatePageLayout
        title="Ticket Templates"
        icon={TemplateIcon}
        items={items}
        loading={loading}
        isAdmin={isAdmin}
        emptyMessage="No templates yet. Create one to speed up ticket creation."
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={(id) => setDeleteTarget(templates.find((t) => t.id === id) ?? null)}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth disableScrollLock>
        <DialogTitle fontWeight={700}>{editing ? 'Edit Template' : 'New Template'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth margin="normal" label="Template Name *"
            inputRef={nameRef}
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
            slotProps={{ htmlInput: { min: 0, step: 0.25 } }}
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

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name}
        itemType="template"
        loading={deleting}
      />

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </>
  );
};

export default TicketTemplatesTab;
