import React from 'react';
import {
  Box, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { DeleteConfirmDialog, MyGridHeader } from '../../common';
import ConfirmTextDialog from '../../common/ConfirmTextDialog';
import { UsersTable, UserFormDialog } from '../usersManagement';
import { usersKeys } from '../usersManagement/api/queryKeys';
import { userToFormValues } from '../usersManagement/utils/toFormValues';
import type { UserFormValues } from '../usersManagement/types/types';
import { type User, type CreateUserData, usersApi } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import { isSuperAdmin, isTenantAdmin, Role } from '../../../types/roles';

// ── Seats-full dialog ────────────────────────────────────────────────────────

const SeatsFullDialog: React.FC<{ open: boolean; onClose: () => void; used: number; total: number }> = ({
  open, onClose, used, total,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Seats limit reached</DialogTitle>
    <DialogContent>
      <Alert severity="warning" sx={{ mt: 1 }}>
        Your tenant has reached the maximum number of users for the current subscription.
        {total > 0 ? ` (${used}/${total} seats used)` : ''}
      </Alert>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="contained">OK</Button>
    </DialogActions>
  </Dialog>
);

// ── Query key factory ────────────────────────────────────────────────────────

const getUsersQueryKey = () => {
  const user = useAuthStore.getState().user;
  if (isTenantAdmin(user?.role)) {
    const slug = localStorage.getItem('tenantSlug') ?? '';
    return usersKeys.tenantScoped(slug);
  }
  return usersKeys.all;
};

// ── Page ─────────────────────────────────────────────────────────────────────

export function UsersManagement() {
  const authUser       = useAuthStore((s) => s.user);
  const isSuper        = isSuperAdmin(authUser?.role);
  const isTenantAdminUser = isTenantAdmin(authUser?.role);

  const f = useAdminFeature<User, CreateUserData>({
    entityName: 'users',
    queryKey: getUsersQueryKey,
    api: {
      getAll: async () => {
        if (isTenantAdmin(useAuthStore.getState().user?.role)) {
          if (!localStorage.getItem('tenantSlug')) return [];
          return usersApi.getTenantUsers();
        }
        return usersApi.getUsers();
      },
      create: usersApi.createUser.bind(usersApi),
      update: usersApi.updateUser.bind(usersApi),
      delete: (id) => usersApi.deleteUser(id),
    },
    messages: {
      success: { created: 'User created successfully', updated: 'User updated successfully', deleted: 'User deleted successfully' },
      error:   { create:  'Error creating user',       update:  'Error updating user',       delete:  'Error deleting user'       },
      titles:  { create:  'Create New User',           edit:    'Edit User'                                                       },
    },
  });

  // ── Seats ──────────────────────────────────────────────────────────────────
  const [seats, setSeats] = React.useState<{ used: number; total: number } | null>(null);
  React.useEffect(() => {
    if (!isTenantAdminUser) return;
    usersApi.getTenantSeats().then(setSeats).catch(() => {});
  }, [isTenantAdminUser, f.entities.length]);

  const seatLimitReached = seats !== null && seats.total > 0 && seats.used >= seats.total;
  const [seatsFullOpen, setSeatsFullOpen] = React.useState(false);

  // ── Force delete ───────────────────────────────────────────────────────────
  const [forceDeleteOpen, setForceDeleteOpen]       = React.useState(false);
  const [forceDeleteUser, setForceDeleteUser]       = React.useState<User | null>(null);
  const [forceDeleteLoading, setForceDeleteLoading] = React.useState(false);

  // ── Reset password ─────────────────────────────────────────────────────────
  const [resetPwdUser,    setResetPwdUser]    = React.useState<User | null>(null);
  const [resetPwdValue,   setResetPwdValue]   = React.useState('');
  const [resetPwdLoading, setResetPwdLoading] = React.useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = async (values: UserFormValues) => {
    const prevSlug  = localStorage.getItem('tenantSlug');
    const nextSlug  = values.tenantSlug ? String(values.tenantSlug) : '';
    if (nextSlug) localStorage.setItem('tenantSlug', nextSlug);

    if (isSuper && !f.ui.editingItem && !nextSlug) {
      f.showSnackbar('Please select a tenant before creating a user', 'error');
      return;
    }

    const submitData = { ...values } as CreateUserData & { tenantSlug?: string };
    delete (submitData as unknown as Record<string, unknown>).tenantSlug;
    if (!submitData.password) delete (submitData as unknown as Record<string, unknown>).password;
    if (isSuper) submitData.role = Role.TENANT_ADMIN;

    f.setSubmitting(true);
    try {
      if (f.ui.editingItem) {
        await f.update(f.ui.editingItem.id, submitData);
        f.showSnackbar(f.messages.success.updated, 'success');
        f.closeDialog();
      } else {
        if (isTenantAdminUser) {
          await usersApi.createTenantUser(submitData);
        } else {
          await usersApi.createUser(submitData);
        }
        f.showSnackbar(f.messages.success.created, 'success');
        f.refetch();
        f.closeDialog();
      }
    } catch (error) {
      f.showSnackbar(f.handleError(error, f.ui.editingItem ? f.messages.error.update : f.messages.error.create), 'error');
      f.logError(f.ui.editingItem ? 'Update' : 'Create', error);
    } finally {
      if (prevSlug) localStorage.setItem('tenantSlug', prevSlug);
      else localStorage.removeItem('tenantSlug');
      f.setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!f.ui.deleteDialog.item) return;
    try {
      await f.remove(f.ui.deleteDialog.item.id);
      f.showSnackbar(f.messages.success.deleted, 'success');
      f.closeDeleteDialog();
    } catch (error) {
      const msg = f.handleError(error, f.messages.error.delete);
      if (msg.includes('related data') || msg.includes('foreign key')) {
        f.closeDeleteDialog();
        setForceDeleteOpen(true);
      } else {
        f.showSnackbar(msg, 'error');
      }
      f.logError('Delete', error);
    }
  };

  const handleForceDeleteConfirm = async () => {
    if (!forceDeleteUser) return;
    setForceDeleteLoading(true);
    try {
      await usersApi.deleteUser(forceDeleteUser.id, { force: true });
      f.showSnackbar('User and related data deleted successfully', 'success');
      setForceDeleteOpen(false);
      setForceDeleteUser(null);
      f.refetch();
    } catch (error) {
      f.showSnackbar(f.handleError(error, 'Error force deleting user'), 'error');
      f.logError('Force Delete', error);
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
      f.showSnackbar('Password reset successfully', 'success');
      setResetPwdUser(null);
      setResetPwdValue('');
    } catch (error) {
      f.showSnackbar(f.handleError(error, 'Error resetting password'), 'error');
    } finally {
      setResetPwdLoading(false);
    }
  };

  // ── Seats message ──────────────────────────────────────────────────────────
  const seatsMessage = isTenantAdminUser && seats
    ? seatLimitReached
      ? `Seats full: ${seats.used}/${seats.total}. You cannot add more users.`
      : `Seats: ${seats.used}/${seats.total}`
    : null;

  const deleteItem = f.ui.deleteDialog.item;
  const deleteWarning = deleteItem?._count &&
    ((deleteItem._count.assignedTickets ?? 0) > 0 ||
     (deleteItem._count.createdTickets  ?? 0) > 0 ||
     (deleteItem._count.comments        ?? 0) > 0)
    ? `This user has associated data: ${deleteItem._count.assignedTickets ?? 0} assigned ticket(s), ${deleteItem._count.createdTickets ?? 0} created ticket(s), ${deleteItem._count.comments ?? 0} comment(s).`
    : undefined;

  return (
    <ErrorBoundary>
      <Box>
        <MyGridHeader
          title={
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box>{isTenantAdminUser ? 'Tenant Users' : 'Users Management'}</Box>
              {seatsMessage && (
                <Alert severity={seatLimitReached ? 'warning' : 'info'} sx={{ mt: 1, py: 0.5, px: 1.5, width: 'fit-content' }}>
                  {seatsMessage}
                </Alert>
              )}
            </Box>
          }
          onAdd={() => {
            if (isTenantAdminUser && seatLimitReached) { setSeatsFullOpen(true); return; }
            f.openDialog();
          }}
          addButtonText="Add User"
          addTooltip={seatLimitReached ? 'Seats full' : 'Add User'}
          icon={PeopleIcon}
        />

        <UsersTable
          users={f.entities}
          loading={f.loading}
          onEdit={f.openDialog}
          onDelete={f.openDeleteDialog}
          onResetPassword={
            isSuper || isTenantAdminUser
              ? (user) => { setResetPwdUser(user); setResetPwdValue(''); }
              : undefined
          }
        />

        <UserFormDialog
          open={f.ui.dialogOpen}
          editing={!!f.ui.editingItem}
          initialValues={f.ui.editingItem ? userToFormValues(f.ui.editingItem) : undefined}
          onClose={f.closeDialog}
          onSubmit={handleSubmit}
        />

        <SeatsFullDialog
          open={seatsFullOpen}
          onClose={() => setSeatsFullOpen(false)}
          used={seats?.used ?? 0}
          total={seats?.total ?? 0}
        />

        <DeleteConfirmDialog
          open={f.ui.deleteDialog.open}
          onClose={f.closeDeleteDialog}
          onConfirm={handleDeleteConfirm}
          itemName={f.ui.deleteDialog.item?.name}
          itemType="user"
          loading={false}
          warningMessage={deleteWarning}
          onForceDelete={() => {
            setForceDeleteUser(f.ui.deleteDialog.item);
            f.closeDeleteDialog();
            setForceDeleteOpen(true);
          }}
        />

        <ConfirmTextDialog
          open={forceDeleteOpen}
          onClose={() => { setForceDeleteOpen(false); setForceDeleteUser(null); setForceDeleteLoading(false); }}
          onConfirm={handleForceDeleteConfirm}
          title="Force Delete User and Related Data"
          message={
            <>
              <Box sx={{ mb: 1 }}>This user has related data. To proceed, type DELETE below.</Box>
              <Box><ul>
                <li>Unassign tickets and tasks assigned to the user</li>
                <li>Delete comments and activities by the user</li>
                <li>Delete tickets created by the user</li>
              </ul></Box>
            </>
          }
          confirmWord="DELETE"
          loading={forceDeleteLoading}
        />

        <Dialog open={!!resetPwdUser} onClose={() => setResetPwdUser(null)} maxWidth="xs" fullWidth>
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
            <Button onClick={handleResetPassword} disabled={resetPwdValue.length < 6 || resetPwdLoading} variant="contained">
              {resetPwdLoading ? 'Resetting…' : 'Reset'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={f.ui.snackbar.open} autoHideDuration={6000} onClose={f.closeSnackbar}>
          <Alert onClose={f.closeSnackbar} severity={f.ui.snackbar.severity}>
            {f.ui.snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}

export default UsersManagement;
