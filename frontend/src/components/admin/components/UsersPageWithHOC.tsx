import React from "react";
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
import ConfirmTextDialog from "../../common/ConfirmTextDialog";
import {
  UsersTable,
  UserFormDialog,
} from "../usersManagement";
import {
  type User,
  type CreateUserData,
  usersApi,
} from "../../../services/api";
import PeopleIcon from "@mui/icons-material/People";

const usersKeys = { all: ["users"] as const };

type UsersPageProps = CRUDProps<User, CreateUserData> &
  UIStateProps<User> &
  MessagesProps &
  ErrorHandlingProps;

function UsersPageComponent(props: UsersPageProps) {
  const {
    entities: users,
    loading,
    create,
    update,
    remove,
    refetch,
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

  const [forceDeleteOpen, setForceDeleteOpen] = React.useState(false);
  const [forceDeleteUser, setForceDeleteUser] = React.useState<User | null>(null);
  const [forceDeleteLoading, setForceDeleteLoading] = React.useState(false);
  const [auxLoading, setAuxLoading] = React.useState(false);

  const handleSubmit = async (values: any) => {
    // Filter out undefined password for editing
    const submitData: CreateUserData = {
      ...values,
      password: values.password || undefined
    };
    if (uiState.editingItem && !submitData.password) {
      delete (submitData as any).password;
    }
    setSubmitting(true);
    try {
      if (uiState.editingItem) {
        await update((uiState.editingItem as User).id, submitData);
        showSnackbar(messages.success.updated, "success");
      } else {
        await create(submitData);
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
      await remove((uiState.deleteDialog.item as User).id);
      showSnackbar(messages.success.deleted, "success");
      closeDeleteDialog();
    } catch (error) {
      const errorMessage = handleError(error, messages.error.delete);
      if (errorMessage.includes("related data") || errorMessage.includes("foreign key")) {
        closeDeleteDialog();
        setForceDeleteOpen(true);
      } else {
        showSnackbar(errorMessage, "error");
      }
      logError("Delete", error);
    }
  };

  const handleForceDeleteConfirm = async () => {
    if (!forceDeleteUser) return;
    setForceDeleteLoading(true);
    try {
      await usersApi.deleteUser(forceDeleteUser.id, { force: true });
      showSnackbar("User and related data deleted successfully", "success");
      setForceDeleteOpen(false);
      setForceDeleteUser(null);
      refetch();
    } catch (error) {
      showSnackbar(handleError(error, "Error force deleting user"), "error");
      logError("Force Delete", error);
    } finally {
      setForceDeleteLoading(false);
    }
  };

  return (
    <Box>
      <MyGridHeader
        title="Users Management"
        onAdd={() => openDialog()}
        addButtonText="Add User"
        addTooltip="Add User"
        icon={PeopleIcon}
      />

      <UsersTable
        users={users}
        loading={loading || auxLoading}
        onEdit={openDialog}
        onDelete={openDeleteDialog}
      />

      <UserFormDialog
        open={uiState.dialogOpen}
        editing={!!uiState.editingItem}
        initialValues={
          uiState.editingItem
            ? {
              name: (uiState.editingItem as User).name,
              email: (uiState.editingItem as User).email,
              password: "",
              role: (uiState.editingItem as User).role,
              phone: (uiState.editingItem as User).phone || "",
              whatsappNotifications: (uiState.editingItem as User).whatsappNotifications || false,
            }
            : undefined
        }
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={uiState.deleteDialog.open}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        itemName={(uiState.deleteDialog.item as User)?.name}
        itemType="user"
        loading={false}
        warningMessage={
          (uiState.deleteDialog.item as User)?._count &&
            (((uiState.deleteDialog.item as User)._count?.assignedTickets || 0) > 0 ||
              ((uiState.deleteDialog.item as User)._count?.createdTickets || 0) > 0 ||
              ((uiState.deleteDialog.item as User)._count?.comments || 0) > 0)
            ? `This user has associated data: ${(uiState.deleteDialog.item as User)._count?.assignedTickets || 0
            } assigned ticket(s), ${(uiState.deleteDialog.item as User)._count?.createdTickets || 0
            } created ticket(s), ${(uiState.deleteDialog.item as User)._count?.comments || 0
            } comment(s). Click Delete to proceed with force deletion.`
            : undefined
        }
        onForceDelete={() => {
          setForceDeleteUser(uiState.deleteDialog.item as User);
          closeDeleteDialog();
          setForceDeleteOpen(true);
        }}
      />

      <ConfirmTextDialog
        open={forceDeleteOpen}
        onClose={() => {
          setForceDeleteOpen(false);
          setForceDeleteUser(null);
          setForceDeleteLoading(false);
        }}
        onConfirm={handleForceDeleteConfirm}
        title="Force Delete User and Related Data"
        message={
          <>
            <Box sx={{ mb: 1 }}>
              You are attempting to delete a user that has related data (tickets, comments, activities, assignments).
            </Box>
            <Box>
              To proceed, type DELETE below. This will:
              <ul>
                <li>Unassign tickets and tasks assigned to the user</li>
                <li>Delete comments and activities by the user</li>
                <li>Delete tickets created by the user</li>
                <li>Remove board permissions and notifications</li>
              </ul>
            </Box>
          </>
        }
        confirmWord="DELETE"
        loading={forceDeleteLoading}
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

const UsersPageWithHOC = withCRUD<User, CreateUserData>(
  withUIState<User>(
    withMessages(
      withErrorHandling(UsersPageComponent, {
        success: {
          created: "User created successfully",
          updated: "User updated successfully",
          deleted: "User deleted successfully",
        },
        error: {
          create: "Error creating user",
          update: "Error updating user",
          delete: "Error deleting user",
        },
        titles: {
          create: "Create New User",
          edit: "Edit User",
        },
      })
    )
  ),
  {
    entityName: "users",
    queryKey: usersKeys.all,
    api: {
      getAll: usersApi.getUsers.bind(usersApi),
      create: usersApi.createUser.bind(usersApi),
      update: usersApi.updateUser.bind(usersApi),
      delete: (id: string) => usersApi.deleteUser(id),
    },
  }
) as React.ComponentType<{}>;

export { UsersPageWithHOC };

export default UsersPageWithHOC;