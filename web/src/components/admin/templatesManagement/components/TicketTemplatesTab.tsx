import React from 'react';
import { Box, Chip, Snackbar, Alert } from '@mui/material';
import { Label as TemplateIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useIsAdmin } from '../../../../stores/authStore';
import { AppDeleteDialog } from '../../../../shared/components';
import TemplatePageLayout from './TemplatePageLayout';
import TicketTemplateFormDialog from './TicketTemplateFormDialog';
import { useTicketTemplates } from '../hooks/useTicketTemplates';
import type { TicketTemplateFormValues } from '../schemas/ticketTemplateSchema';
import type { TemplateItem } from '../types/types';

const TicketTemplatesTab: React.FC = () => {
  const theme = useTheme();
  const isAdmin = useIsAdmin();
  const {
    templates, isLoading,
    dialogOpen, editing, deleteTarget, snack, saving, deleting,
    openCreate, openEdit, handleSubmit, handleDelete,
    setDialogOpen, setDeleteTarget, setSnack,
  } = useTicketTemplates();

  const PRIORITY_COLORS: Record<string, string> = {
    LOW:    theme.palette.success.main,
    MEDIUM: theme.palette.warning.main,
    HIGH:   theme.palette.error.main,
    URGENT: theme.palette.error.dark,
  };

  const items: TemplateItem[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    meta: (
      <Box display="flex" gap={1} flexWrap="wrap">
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
      </Box>
    ),
  }));

  return (
    <>
      <TemplatePageLayout
        title="Ticket Templates"
        icon={TemplateIcon}
        items={items}
        loading={isLoading}
        isAdmin={isAdmin}
        emptyMessage="No templates yet. Create one to speed up ticket creation."
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={(id) => setDeleteTarget(templates.find((t) => t.id === id) ?? null)}
      />

      <TicketTemplateFormDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit as (v: TicketTemplateFormValues) => Promise<void>}
      />

      <AppDeleteDialog
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
