import React from "react";
import {
  Box,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
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
import { UsersTable, UserFormDialog } from "../usersManagement";
import { type User, type CreateUserData, usersApi } from "../../../services/api";
import { useAuthStore } from "../../../stores/authStore";
import { isSuperAdmin, isTenantAdmin, Role } from "../../../types/roles";
import PeopleIcon from "@mui/icons-material/People";

const SeatsFullDialog = ({
  open,
  onClose,
  used,
  total,
}: {
  open: boolean;
  onClose: () => void;
  used: number;
  total: number;
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Seats limit reached</DialogTitle>
    <DialogContent>
      <Alert severity="warning" sx={{ mt: 1 }}>
        Your tenant has reached the maximum number of users for the current subscription.
        {total > 0 ? ` (${used}/${total} seats used)` : ""}
      </Alert>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="contained">
        OK
      </Button>
    </DialogActions>
  </Dialog>
);

const usersKeys = { all: ["users"] as const, tenant: ["users", "tenant"] as const };

const getUsersQueryKey = () => {
  const user = useAuthStore.getState().user;
  if (isTenantAdmin(user?.role)) {
    const tenantSlug = localStorage.getItem("tenantSlug") || "";
    return [...usersKeys.tenant, tenantSlug] as const;
  }
  return usersKeys.all;
};

type UsersPageProps = CRUDProps<User, CreateUserData> &
  UIStateProps &
  MessagesProps &
  ErrorHandlingProps;

function UsersPageComponent(props: UsersPageProps) {
  const {
    entities: users,
    loading,
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

  const authUser = useAuthStore((s) => s.user);
  const isSuper = isSuperAdmin(authUser?.role);
  const isTenantAdminUser = isTenantAdmin(authUser?.role);

  const [seats, setSeats] = React.useState<{ used: number; total: number } | null>(null);

  React.useEffect(() => {
    if (!isTenantAdminUser) return;
    usersApi.getTenantSeats().then(setSeats).catch(() => {});
  }, [isTenantAdminUser, users.length]); // re-fetch when user list changes

  const seatLimitReached = seats !== null && seats.total > 0 && seats.used >= seats.total;

  const [seatsFullOpen, setSeatsFullOpen] = React.useState(false);

  const [forceDeleteOpen, setForceDeleteOpen] = React.useState(false);
  const [forceDeleteUser, setForceDeleteUser] = React.useState<User | null>(null);
  const [forceDeleteLoading, setForceDeleteLoading] = React.useState(false);

  // Reset password dialog state
  const [resetPwdUser, setResetPwdUser] = React.useState<User | null>(null);
  const [resetPwdValue, setResetPwdValue] = React.useState("");
  const [resetPwdLoading, setResetPwdLoading] = React.useState(false);

  const handleSubmit = async (values: any) => {
    const prevTenantSlug = localStorage.getItem("tenantSlug");
    const nextTenantSlug = values?.tenantSlug ? String(values.tenantSlug) : "";

    if (nextTenantSlug) localStorage.setItem("tenantSlug", nextTenantSlug);

    if (isSuper && !uiState.editingItem && !nextTenantSlug) {
      showSnackbar("Please select a tenant before creating a user", "error");
      setSubmitting(false);
      return;
    }

    const submitData: CreateUserData = { ...values, password: values.password || undefined };
    delete (submitData as any).tenantSlug;
    if (uiState.editingItem && !submitData.password) delete (submitData as any).password;

    // SUPER_ADMIN always creates TENANT_ADMIN
    if (isSuper) submitData.role = Role.TENANT_ADMIN;

    setSubmitting(true);
    try {
      if (uiState.editingItem) {
        await update((uiState.editingItem as User).id, submitData);
        showSnackbar(messages.success.updated, "success");
      } else {
        if (isTenantAdminUser) {
          await usersApi.createTenantUser(submitData);
        } else {
          await usersApi.createUser(submitData);
        }
        showSnackbar(messages.success.created, "success");
        refetch();
        closeDialog();
      }
    } catch (error) {
      showSnackbar(
        handleError(error, uiState.editingItem ? messages.error.update : messages.error.create),
        "error"
      );
      logError(uiState.editingItem ? "Update" : "Create", error);
    } finally {
      if (prevTenantSlug) localStorage.setItem("tenantSlug", prevTenantSlug);
      else localStorage.removeItem("tenantSlug");
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

  const handleResetPassword = async () => {
    if (!resetPwdUser || resetPwdValue.length < 6) return;
    setResetPwdLoading(true);
    try {
      if (isSuper) {
        await usersApi.resetPassword(resetPwdUser.id, resetPwdValue);
      } else {
        await usersApi.resetTenantUserPassword(resetPwdUser.id, resetPwdValue);
      }
      showSnackbar("Password reset successfully", "success");
      setResetPwdUser(null);
      setResetPwdValue("");
    } catch (error) {
      showSnackbar(handleError(error, "Error resetting password"), "error");
    } finally {
      setResetPwdLoading(false);
    }
  };

  const seatsMessage =
    isTenantAdminUser && seats
      ? seatLimitReached
        ? `Seats full: ${seats.used}/${seats.total}. You cannot add more users.`
        : `Seats: ${seats.used}/${seats.total}`
      : null;

  return (
    <Box>
      <MyGridHeader
        title={
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box>{isTenantAdminUser ? "Tenant Users" : "Users Management"}</Box>
            {seatsMessage && (
              <Alert
                severity={seatLimitReached ? "warning" : "info"}
                sx={{ mt: 1, py: 0.5, px: 1.5, width: "fit-content" }}
              >
                {seatsMessage}
              </Alert>
            )}
          </Box>
        }
        onAdd={() => {
          if (isTenantAdminUser && seatLimitReached) {
            setSeatsFullOpen(true);
            return;
          }
          openDialog();
        }}
        addButtonText="Add User"
        addTooltip={seatLimitReached ? "Seats full" : "Add User"}
        icon={PeopleIcon}
      />

      <UsersTable
        users={users}
        loading={loading}
        onEdit={openDialog}
        onDelete={openDeleteDialog}
        onResetPassword={
          isSuper || isTenantAdminUser
            ? (user) => {
                setResetPwdUser(user);
                setResetPwdValue("");
              }
            : undefined
        }
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
                tenantSlug: "",
                phone: (uiState.editingItem as User).phone || "",
                whatsappNotifications:
                  (uiState.editingItem as User).whatsappNotifications || false,
              }
            : undefined
        }
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />

      <SeatsFullDialog
        open={seatsFullOpen}
        onClose={() => setSeatsFullOpen(false)}
        used={seats?.used ?? 0}
        total={seats?.total ?? 0}
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
            ? `This user has associated data: ${(uiState.deleteDialog.item as User)._count?.assignedTickets || 0} assigned ticket(s), ${(uiState.deleteDialog.item as User)._count?.createdTickets || 0} created ticket(s), ${(uiState.deleteDialog.item as User)._count?.comments || 0} comment(s).`
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
              This user has related data. To proceed, type DELETE below.
            </Box>
            <Box>
              <ul>
                <li>Unassign tickets and tasks assigned to the user</li>
                <li>Delete comments and activities by the user</li>
                <li>Delete tickets created by the user</li>
              </ul>
            </Box>
          </>
        }
        confirmWord="DELETE"
        loading={forceDeleteLoading}
      />

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetPwdUser}
        onClose={() => setResetPwdUser(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset Password — {resetPwdUser?.name}</DialogTitle>
        <DialogContent>
          <TextField
            label="New Password"
            type="password"
            value={resetPwdValue}
            onChange={(e) => setResetPwdValue(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
            helperText="Minimum 6 characters"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPwdUser(null)}>Cancel</Button>
          <Button
            onClick={handleResetPassword}
            disabled={resetPwdValue.length < 6 || resetPwdLoading}
            variant="contained"
          >
            {resetPwdLoading ? "Resetting…" : "Reset"}
          </Button>
        </DialogActions>
      </Dialog>

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
  withUIState(
    withMessages(
      withErrorHandling(UsersPageComponent),
      {
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
        titles: { create: "Create New User", edit: "Edit User" },
      }
    )
  ),
  {
    entityName: "users",
    queryKey: getUsersQueryKey,
    api: {
      getAll: async () => {
        const user = useAuthStore.getState().user;
        if (isTenantAdmin(user?.role)) {
          const tenantSlug = localStorage.getItem("tenantSlug");
          if (!tenantSlug) return [];
          return usersApi.getTenantUsers();
        }
        return usersApi.getUsers();
      },
      create: usersApi.createUser.bind(usersApi),
      update: usersApi.updateUser.bind(usersApi),
      delete: (id: string) => usersApi.deleteUser(id),
    },
  }
) as React.ComponentType<{}>;

export { UsersPageWithHOC };
export default UsersPageWithHOC;
