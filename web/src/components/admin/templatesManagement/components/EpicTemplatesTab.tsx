import React from 'react';
import { Box, Chip, Typography, Snackbar, Alert } from '@mui/material';
import { AccountTree as EpicsIcon } from '@mui/icons-material';
import { useIsAdmin } from '../../../../stores/authStore';
import TemplateFormDialog from '../../../epics/components/TemplateFormDialog';
import { DeleteConfirmDialog } from '../../../common';
import TemplatePageLayout, { type TemplateItem } from './TemplatePageLayout';
import { useEpicTemplates } from '../hooks/useEpicTemplates';

const EpicTemplatesTab: React.FC = () => {
  const isAdmin = useIsAdmin();
  const {
    templates, isLoading,
    dialogOpen, editing, deleteTarget, snack, deleting,
    openCreate, openEdit, handleSubmit, handleDelete,
    setDialogOpen, setDeleteTarget, setSnack,
  } = useEpicTemplates();

  const items: TemplateItem[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    meta: (
      <>
        <Chip label={t.category} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
        <Chip
          label={`${t.features.length} feature${t.features.length !== 1 ? 's' : ''}`}
          size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }}
        />
      </>
    ),
    detail: t.features.length > 0 ? (
      <Box>
        {t.features.slice(0, 3).map((f, i) => (
          <Typography key={i} variant="caption" color="text.secondary" display="block">
            · {f.title}{(f.steps ?? []).length > 0 ? ` (${f.steps!.length} steps)` : ''}
          </Typography>
        ))}
        {t.features.length > 3 && (
          <Typography variant="caption" color="text.disabled">
            …and {t.features.length - 3} more
          </Typography>
        )}
      </Box>
    ) : undefined,
  }));

  return (
    <>
      <TemplatePageLayout
        title="Epic Templates"
        icon={EpicsIcon}
        items={items}
        loading={isLoading}
        isAdmin={isAdmin}
        emptyMessage="No epic templates yet. Create one to pre-fill new epics with standard feature sets."
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={(id) => setDeleteTarget(templates.find((x) => x.id === id) ?? null)}
      />

      <TemplateFormDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

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

export default EpicTemplatesTab;
