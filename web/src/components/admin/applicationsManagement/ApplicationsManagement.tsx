import { Box, Snackbar, Alert } from '@mui/material';
import ApiIcon from '@mui/icons-material/Api';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { DeleteConfirmDialog, MyGridHeader } from '../../common';
import { ApplicationsTable, ApplicationFormDialog } from '.';
import { applicationsApi } from './api/applications';
import { applicationsKeys } from './api/queryKeys';
import { applicationToFormValues } from './utils/toFormValues';
import type { Application, CreateApplicationData } from '../../../services/api';

export default function ApplicationsManagement() {
  const f = useAdminFeature<Application, CreateApplicationData>({
    entityName: 'applications',
    queryKey: applicationsKeys.all,
    api: {
      getAll:  applicationsApi.getApplications.bind(applicationsApi),
      create:  applicationsApi.createApplication.bind(applicationsApi),
      update:  applicationsApi.updateApplication.bind(applicationsApi),
      delete:  applicationsApi.deleteApplication.bind(applicationsApi),
    },
    messages: {
      success: { created: 'Application created successfully', updated: 'Application updated successfully', deleted: 'Application deleted successfully' },
      error:   { create:  'Error creating application',       update:  'Error updating application',       delete:  'Error deleting application'       },
      titles:  { create:  'Create New Application',           edit:    'Edit Application'                                                              },
    },
  });

  return (
    <ErrorBoundary>
      <Box>
        <MyGridHeader
          title="Applications Management"
          onAdd={() => f.openDialog()}
          addButtonText="Add Application"
          addTooltip="Add Application"
          icon={ApiIcon}
        />

        <ApplicationsTable
          applications={f.entities}
          loading={f.loading}
          onEdit={f.openDialog}
          onDelete={f.openDeleteDialog}
        />

        <ApplicationFormDialog
          open={f.ui.dialogOpen}
          editing={!!f.ui.editingItem}
          initialValues={f.ui.editingItem ? applicationToFormValues(f.ui.editingItem) : undefined}
          onClose={f.closeDialog}
          onSubmit={(values) => f.handleSubmit(values)}
          submitting={f.ui.submitting}
        />

        <DeleteConfirmDialog
          open={f.ui.deleteDialog.open}
          onClose={f.closeDeleteDialog}
          onConfirm={() => f.handleDeleteConfirm((a) => a.id)}
          itemName={f.ui.deleteDialog.item?.name}
          itemType="application"
          loading={false}
        />

        <Snackbar open={f.ui.snackbar.open} autoHideDuration={6000} onClose={f.closeSnackbar}>
          <Alert onClose={f.closeSnackbar} severity={f.ui.snackbar.severity}>
            {f.ui.snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}
