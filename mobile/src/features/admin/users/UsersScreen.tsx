import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import AdminCrudScreen      from '@/src/features/admin/shared/AdminCrudScreen';
import UserForm             from './components/UserForm';
import UserDetailScreen     from './components/UserDetailScreen';
import { AppDeleteDialog, AppConfirmDialog } from '@/src/shared/components';
import { useUsers }         from './hooks/useUsers';
import { usersApi, usersKeys } from './api/users';
import { useToast }         from '@/src/shared/hooks/useToast';
import type { User, CreateUserData } from '@/src/services/api/types';

// ── Helper — extract error message from API response ──────────────────────────
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as any;
    return e?.response?.data?.error ?? e?.message ?? '';
  }
  return '';
}

function hasRelatedData(error: unknown): boolean {
  return getErrorMessage(error).toLowerCase().includes('associated');
}

const UsersScreen: React.FC = () => {
  const { t }       = useTranslation();
  const toast       = useToast();
  const queryClient = useQueryClient();
  const { f, columns, exporting, handleExport, selectedId, setSelectedId, isSuperAdmin } = useUsers();

  // ── Detail → Edit state ────────────────────────────────────────────────────
  const [editingFromDetail, setEditingFromDetail] = useState<User | null>(null);

  // ── Detail → Delete state ──────────────────────────────────────────────────
  const [deletingFromDetail, setDeletingFromDetail] = useState<User | null>(null);
  const [deleting,           setDeleting]           = useState(false);

  // ── Force-delete state (both list and detail paths) ────────────────────────
  const [forceTarget,  setForceTarget]  = useState<User | null>(null);
  const [forceDeleting, setForceDeleting] = useState(false);

  // ── Normal delete from detail view ────────────────────────────────────────
  const handleDeleteFromDetail = async () => {
    if (!deletingFromDetail) return;
    setDeleting(true);
    try {
      await f.remove(deletingFromDetail.id);
      queryClient.removeQueries({ queryKey: usersKeys.detail(deletingFromDetail.id) });
      toast.success(t('users.messages.deleted'));
      setSelectedId(null);
      setDeletingFromDetail(null);
    } catch (error) {
      setDeletingFromDetail(null);
      if (hasRelatedData(error)) {
        // Escalate to force-delete dialog
        setForceTarget(deletingFromDetail);
      } else {
        toast.error(t('users.messages.errorDelete'));
      }
    } finally {
      setDeleting(false);
    }
  };

  // ── Force delete (list or detail, role-aware) ─────────────────────────────
  const handleForceDelete = async () => {
    if (!forceTarget) return;
    setForceDeleting(true);
    try {
      // Super admin uses /users/:id?force=true
      // Tenant admin uses /users/tenant/:id?force=true (scoped to own tenant)
      if (isSuperAdmin) {
        await usersApi.forceDeleteUser(forceTarget.id);
      } else {
        await usersApi.forceTenantDeleteUser(forceTarget.id);
      }
      queryClient.removeQueries({ queryKey: usersKeys.detail(forceTarget.id) });
      f.refetch();
      toast.success(t('users.messages.forceDeleted'));
      setForceTarget(null);
      if (selectedId === forceTarget.id) setSelectedId(null);
    } catch {
      toast.error(t('users.messages.errorDelete'));
    } finally {
      setForceDeleting(false);
    }
  };

  // ── Delete failed from list view → escalate to force-delete ───────────────
  const handleListDeleteFailed = (item: User, error: unknown) => {
    if (hasRelatedData(error)) {
      setForceTarget(item);
    }
    // Other errors are handled by NetworkErrorDialog globally
  };

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedId && !editingFromDetail) {
    const selectedUser = f.entities.find((u) => u.id === selectedId);
    return (
      <>
        <UserDetailScreen
          userId={selectedId}
          isSuperAdmin={isSuperAdmin}
          initialData={selectedUser ?? null}
          onClose={() => setSelectedId(null)}
          onEdit={() => setEditingFromDetail(selectedUser ?? null)}
          onDelete={() => setDeletingFromDetail(selectedUser ?? null)}
          queryEnabled={!deletingFromDetail}
        />

        {/* Normal delete confirm */}
        <AppDeleteDialog
          open={!!deletingFromDetail}
          onClose={() => setDeletingFromDetail(null)}
          onConfirm={handleDeleteFromDetail}
          itemName={deletingFromDetail?.name}
          itemType={t('users.itemType')}
          loading={deleting}
        />

        {/* Force-delete confirm — shown after normal delete fails */}
        <AppConfirmDialog
          open={!!forceTarget && !deletingFromDetail}
          onClose={() => setForceTarget(null)}
          onConfirm={handleForceDelete}
          title={t('users.forceDelete.title')}
          message={t('users.forceDelete.message', { name: forceTarget?.name ?? '' })}
          confirmWord="DELETE"
          loading={forceDeleting}
          confirmLabel={t('users.forceDelete.confirmLabel')}
          confirmColor="error"
        />
      </>
    );
  }

  // ── Edit from detail ────────────────────────────────────────────────────────
  if (editingFromDetail) {
    return (
      <UserForm
        item={editingFromDetail}
        onClose={() => {
          setEditingFromDetail(null);
          setSelectedId(editingFromDetail.id);
        }}
        submitting={false}
        mode="page"
        onSave={async (data: CreateUserData) => {
          await f.update(editingFromDetail.id, data);
          setEditingFromDetail(null);
          setSelectedId(editingFromDetail.id);
        }}
      />
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <>
      <AdminCrudScreen<User>
        title={t('users.title')}
        icon="👤"
        itemType={t('users.itemType')}
        entities={f.entities}
        loading={f.loading}
        columns={columns}
        searchFields={['name', 'email', 'phone']}
        getItemName={(u) => u.name}
        onDelete={(id) => f.remove(id)}
        onDeleteFailed={handleListDeleteFailed}
        onRefresh={f.refetch}
        onExport={handleExport}
        exporting={exporting}
        searchPlaceholder={t('users.searchPlaceholder')}
        emptyMessage={t('users.emptyMessage')}
        emptyFilteredMessage={t('users.emptyFilteredMessage')}
        addLabel={t('users.addTitle')}
        exportLabel={t('common.exportPdf')}
        exportingLabel={t('common.exporting')}
        refreshLabel={t('common.refresh')}
        refreshingLabel={t('common.refreshing')}
        deleteSuccessMessage={t('users.messages.deleted')}
        onRowPress={(user) => setSelectedId(user.id)}
        renderForm={(item, onClose) => (
          <UserForm
            item={item}
            onClose={onClose}
            submitting={f.ui.submitting}
            mode="page"
            onSave={async (data: CreateUserData) => {
              if (item) await f.update(item.id, data);
              else      await f.create(data);
              onClose();
            }}
          />
        )}
      />

      {/* Force-delete confirm — shown after list delete fails */}
      <AppConfirmDialog
        open={!!forceTarget}
        onClose={() => setForceTarget(null)}
        onConfirm={handleForceDelete}
        title={t('users.forceDelete.title')}
        message={t('users.forceDelete.message', { name: forceTarget?.name ?? '' })}
        confirmWord="DELETE"
        loading={forceDeleting}
        confirmLabel={t('users.forceDelete.confirmLabel')}
        confirmColor="error"
      />
    </>
  );
};

export default UsersScreen;
