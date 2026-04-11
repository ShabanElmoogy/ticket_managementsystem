import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, IconButton, Tooltip,
  Snackbar, Alert, CircularProgress, Collapse,
} from '@mui/material';
import { Add, Edit, Delete, LibraryBooks, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { epicTemplatesApi, type EpicTemplate, type CreateTemplateData } from './api/epicTemplates';
import TemplateFormDialog from './components/TemplateFormDialog';
import { DeleteConfirmDialog } from '../common';
import { useIsAdmin } from '../../stores/authStore';

const EpicTemplatesPage: React.FC = () => {
  const qc = useQueryClient();
  const isAdmin = useIsAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EpicTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EpicTemplate | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['epic-templates'],
    queryFn: () => epicTemplatesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateData) => epicTemplatesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['epic-templates'] }); setSnack({ msg: 'Template created', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to create template', severity: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplateData> }) => epicTemplatesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['epic-templates'] }); setSnack({ msg: 'Template updated', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to update template', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => epicTemplatesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['epic-templates'] }); setSnack({ msg: 'Template deleted', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to delete template', severity: 'error' }),
  });

  const handleSubmit = async (data: CreateTemplateData) => {
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data });
    else await createMutation.mutateAsync(data);
  };

  const categories = [...new Set(templates.map((t) => t.category))].sort();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <LibraryBooks color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Epic Templates</Typography>
            <Typography variant="body2" color="text.secondary">Pre-built feature sets for recurring project types</Typography>
          </Box>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setDialogOpen(true); }}>
            New Template
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : templates.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <LibraryBooks sx={{ fontSize: 56, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">No templates yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Create templates to pre-fill new epics with standard feature sets
          </Typography>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setDialogOpen(true); }}>
              Create First Template
            </Button>
          )}
        </Paper>
      ) : (
        categories.map((cat) => (
          <Box key={cat} mb={3}>
            <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" mb={1}>
              {cat}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
              {templates.filter((t) => t.category === cat).map((t) => (
                <Paper key={t.id} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  <Box px={2} py={1.5} display="flex" alignItems="center" gap={1}>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>{t.name}</Typography>
                      {t.description && (
                        <Typography variant="caption" color="text.secondary" noWrap display="block">{t.description}</Typography>
                      )}
                    </Box>
                    <Chip label={`${t.features.length} features`} size="small" />
                    {isAdmin && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(t)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <IconButton size="small" onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                      {expanded === t.id ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </IconButton>
                  </Box>

                  <Collapse in={expanded === t.id}>
                    <Box px={2} pb={2}>
                      {t.features.map((f, i) => (
                        <Box key={i} mb={1}>
                          <Typography variant="body2" fontWeight={600}>
                            {i + 1}. {f.title}
                          </Typography>
                          {f.description && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ pl: 1.5 }}>
                              {f.description}
                            </Typography>
                          )}
                          {(f.steps ?? []).length > 0 && (
                            <Box pl={1.5} mt={0.5}>
                              {f.steps!.map((s, si) => (
                                <Typography key={si} variant="caption" color="text.secondary" display="block">
                                  · {s.title}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Paper>
              ))}
            </Box>
          </Box>
        ))
      )}

      <TemplateFormDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMutation.mutate(deleteTarget!.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.name}
        itemType="template"
        loading={deleteMutation.isPending}
      />

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EpicTemplatesPage;
