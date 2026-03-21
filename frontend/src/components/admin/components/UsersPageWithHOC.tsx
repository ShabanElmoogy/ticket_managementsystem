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
  tenantsApi,
} from "../../../services/api";
import { useAuthStore } from "../../../stores/authStore";
import PeopleIcon from "@mui/icons-material/People";

const usersKeys = { all: ["users"] as const, tenant: ["users", "tenant"] as const };

const getUsersQueryKey = () => {
  const user = useAuthStore.getState().user;
  const tenantSlug = localStorage.getItem("tenantSlug") || "";
  // Include tenantSlug so switching tenants triggers a refetch.
  return user?.role === "TENANT_ADMIN" ? ([...usersKeys.tenant, tenantSlug] as const) : usersKeys.all;
};

type UsersPageProps = CRUDProps<User, CreateUserData> &
  UIStateProps &
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

  const authUser = useAuthStore((s) => s.user);
  const isTenantAdmin = authUser?.role === "TENANT_ADMIN";

  const [forceDeleteOpen, setForceDeleteOpen] = React.useState(false);
  const [forceDeleteUser, setForceDeleteUser] = React.useState<User | null>(null);
  const [forceDeleteLoading, setForceDeleteLoading] = React.useState(false);
  const [auxLoading] = React.useState(false);

  const handleCreateTenantWithAdmin = async () => {
    setSubmitting(true);
    try {
      // Minimal flow:
      // 1) Create tenant
      // 2) Create tenant admin user under that tenant (by setting X-Tenant-Slug via localStorage)
      const tenantName = window.prompt("Tenant name");
      if (!tenantName) return;

      const tenantSlug = window.prompt(
        "Tenant slug (optional). Leave empty to auto-generate",
        tenantName.toLowerCase().replace(/\s+/g, "-")
      );

      const tenant = await tenantsApi.create({
        name: tenantName,
        slug: tenantSlug?.trim() ? tenantSlug.trim() : undefined,
      });

      const adminName = window.prompt("Tenant admin name");
      if (!adminName) return;

      const adminEmail = window.prompt("Tenant admin email");
      if (!adminEmail) return;

      const adminPassword = window.prompt("Tenant admin password");
      if (!adminPassword) return;

      // Temporarily set tenant context for the create-user call.
      const prevTenantSlug = localStorage.getItem("tenantSlug");
      localStorage.setItem("tenantSlug", tenant.slug);
      try {
        await usersApi.createUser({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: "TENANT_ADMIN",
        });
      } finally {
        if (prevTenantSlug) localStorage.setItem("tenantSlug", prevTenantSlug);
        else localStorage.removeItem("tenantSlug");
      }

      showSnackbar("Tenant and tenant admin created successfully", "success");
      refetch();
    } catch (error) {
      showSnackbar(handleError(error, "Error creating tenant and admin"), "error");
      logError("Create Tenant + Admin", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (values: any) => {
    // If super admin selected a tenant in the form, temporarily set tenant context
    // so the API client sends X-Tenant-Slug.
    const prevTenantSlug = localStorage.getItem("tenantSlug");
    const nextTenantSlug = values?.tenantSlug ? String(values.tenantSlug) : "";

    if (nextTenantSlug) localStorage.setItem("tenantSlug", nextTenantSlug);

    // Filter out undefined password for editing
    const submitData: CreateUserData = {
      ...values,
      password: values.password || undefined,
    };

    // tenantSlug is UI-only; backend uses header.
    delete (submitData as any).tenantSlug;

    if (uiState.editingItem && !submitData.password) {
      delete (submitData as any).password;
    }

    setSubmitting(true);
    try {
      if (uiState.editingItem) {
        // Tenant admin editing is not supported by backend routes (super admin only)
        if (isTenantAdmin) {
          showSnackbar("Tenant admin cannot edit users (not implemented)", "error");
          return;
        }
        await update((uiState.editingItem as User).id, submitData);
        showSnackbar(messages.success.updated, "success");
      } else {
        // Tenant admin creates via tenant-scoped endpoint
        if (isTenantAdmin) {
          await usersApi.createTenantUser(submitData);
          showSnackbar(messages.success.created, "success");
          refetch();
        } else {
          await create(submitData);
          showSnackbar(messages.success.created, "success");
        }
      }
      closeDialog();
    } catch (error) {
      const errorMessage = uiState.editingItem
        ? messages.error.update
        : messages.error.create;
      showSnackbar(handleError(error, errorMessage), "error");
      logError(uiState.editingItem ? "Update" : "Create", error);
    } finally {
      // restore tenant context
      if (nextTenantSlug) {
        if (prevTenantSlug) localStorage.setItem("tenantSlug", prevTenantSlug);
        else localStorage.removeItem("tenantSlug");
      }
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
        title={isTenantAdmin ? "Tenant Users" : "Users Management"}
        onAdd={() => openDialog()}
        addButtonText="Add User"
        addTooltip="Add User"
        icon={PeopleIcon}
        extraActions={
          isTenantAdmin ? null : (
            <>
              <button
                type="button"
                onClick={handleCreateTenantWithAdmin}
                style={{
                  marginLeft: 8,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Create Tenant + Admin
              </button>
            </>
          )
        }
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
              tenantSlug: "",
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
        titles: {
          create: "Create New User",
          edit: "Edit User",
        },
      }
    )
  ),
  {
    entityName: "users",
    queryKey: getUsersQueryKey(),
    api: {
      // For tenant admin, the backend requires /users/tenant.
      // We decide which endpoint to call based on the logged-in role.
      getAll: async () => {
        const user = useAuthStore.getState().user;
        if (user?.role === "TENANT_ADMIN") {
          // Ensure tenant context exists; otherwise the backend will return 400.
          const tenantSlug = localStorage.getItem("tenantSlug");
          if (!tenantSlug) {
            console.warn("Missing tenantSlug in localStorage; cannot load tenant users");
            return [];
          }
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