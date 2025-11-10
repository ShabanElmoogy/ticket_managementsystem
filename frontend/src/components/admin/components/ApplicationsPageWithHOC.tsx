import { Box, Snackbar, Alert } from "@mui/material";
import {
  withCRUD,
  withUIState,
  withMessages,
  withErrorHandling,
  type CRUDProps,
  type UIStateProps,
  type MessagesProps,
  type ErrorHandlingProps,
} from "../../../shared";
import { DeleteConfirmDialog, MyGridHeader } from "../../common";
import {
  ApplicationsTable,
  ApplicationFormDialog,
} from "../applicationsManagement";
import { applicationsApi } from "../applicationsManagement/api/applications";
const applicationsKeys = { all: ["applications"] as const };
import {
  type Application,
  type CreateApplicationData,
} from "../../../services/api";
import ApiIcon from "@mui/icons-material/Api";

interface ApplicationsPageProps
  extends CRUDProps<Application, CreateApplicationData>,
    UIStateProps,
    MessagesProps,
    ErrorHandlingProps {}

interface ApplicationsPageComponentProps
  extends Omit<ApplicationsPageProps, "loading"> {}

function ApplicationsPageComponent(props: ApplicationsPageComponentProps) {
  const {
    entities: applications,
    create,
    update,
    remove,
    uiState,
    openDialog,
    closeDialog,
    showSnackbar,
    closeSnackbar,
    openDeleteDialog,
    closeDeleteDialog,
    setSubmitting,
    messages,
    handleError,
    logError,
  } = props;

  const handleSubmit = async (values: CreateApplicationData) => {
    setSubmitting(true);
    try {
      if (uiState.editingItem) {
        await update((uiState.editingItem as Application).id, values);
        showSnackbar(messages.success.updated, "success");
      } else {
        await create(values);
        showSnackbar(messages.success.created, "success");
      }
      closeDialog();
    } catch (error) {
      const errorMessage = uiState.editingItem
        ? messages.error.update
        : messages.error.create;
      showSnackbar(handleError(error, errorMessage), "error");
      logError(uiState.editingItem ? "Update" : "Create", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!uiState.deleteDialog.item) return;
    try {
      await remove((uiState.deleteDialog.item as Application).id);
      showSnackbar(messages.success.deleted, "success");
      closeDeleteDialog();
    } catch (error) {
      showSnackbar(handleError(error, messages.error.delete), "error");
      logError("Delete", error);
    }
  };

  return (
    <Box>
      <MyGridHeader
        title="Applications Management"
        onAdd={() => openDialog()}
        addButtonText="Add Application"
        addTooltip="Add Application"
        icon={ApiIcon}
      />

      <ApplicationsTable
        applications={applications}
        loading={false}
        onEdit={openDialog}
        onDelete={openDeleteDialog}
      />

      <ApplicationFormDialog
        open={uiState.dialogOpen}
        editing={!!uiState.editingItem}
        initialValues={
          uiState.editingItem
            ? {
                name: (uiState.editingItem as Application).name,
                description:
                  (uiState.editingItem as Application).description || "",
                version: (uiState.editingItem as Application).version || "",
              }
            : undefined
        }
        onClose={closeDialog}
        onSubmit={handleSubmit}
        submitting={uiState.submitting}
      />

      <DeleteConfirmDialog
        open={uiState.deleteDialog.open}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        itemName={(uiState.deleteDialog.item as Application)?.name}
        itemType="application"
        loading={false}
      />

      <Snackbar
        open={uiState.snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity={uiState.snackbar.severity}>
          {uiState.snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// Compose HOCs
const ApplicationsPageWithHOC = withCRUD(
  withUIState(
    withMessages(withErrorHandling(ApplicationsPageComponent), {
      success: {
        created: "Application created successfully",
        updated: "Application updated successfully",
        deleted: "Application deleted successfully",
      },
      error: {
        create: "Error creating application",
        update: "Error updating application",
        delete: "Error deleting application",
      },
      titles: {
        create: "Create New Application",
        edit: "Edit Application",
      },
    })
  ),
  {
    entityName: "applications",
    queryKey: applicationsKeys.all,
    api: {
      getAll: applicationsApi.getApplications.bind(applicationsApi),
      create: applicationsApi.createApplication.bind(applicationsApi),
      update: applicationsApi.updateApplication.bind(applicationsApi),
      delete: applicationsApi.deleteApplication.bind(applicationsApi),
    },
  }
) as React.ComponentType<{}>;

export { ApplicationsPageWithHOC };

export default ApplicationsPageWithHOC;
