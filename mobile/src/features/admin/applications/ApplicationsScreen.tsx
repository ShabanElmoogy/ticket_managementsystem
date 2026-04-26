import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import AdminCrudScreen         from '@/src/features/admin/shared/AdminCrudScreen';
import { AppDeleteDialog }     from '@/src/shared/components';
import { useToast }            from '@/src/shared/hooks/useToast';
import { applicationsKeys } from '@/src/features/admin/applications/api/applications';
import ApplicationDetailScreen from '@/src/features/admin/applications/components/ApplicationDetailScreen';
import ApplicationForm from '@/src/features/admin/applications/components/ApplicationForm';
import { useApplications } from '@/src/features/admin/applications/hooks/useApplications';
import type { Application, CreateApplicationData } from '@/src/services/api/types';

const ApplicationsScreen: React.FC = () => {
  const { t }    = useTranslation();
  const toast    = useToast();
  const queryClient = useQueryClient();
  const { f, columns, exporting, handleExport, selectedId, setSelectedId } = useApplications();

  // ── Detail → Edit state ────────────────────────────────────────────────────
  const [editingFromDetail, setEditingFromDetail] = useState<Application | null>(null);

  // ── Detail → Delete state ──────────────────────────────────────────────────
  const [deletingFromDetail, setDeletingFromDetail] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteFromDetail = async () => {
    if (!deletingFromDetail) return;
    setDeleting(true);
    try {
      await f.remove(deletingFromDetail.id);
      // Remove the detail query from cache immediately — prevents any
      // background refetch from hitting the now-deleted resource
      queryClient.removeQueries({ queryKey: applicationsKeys.detail(deletingFromDetail.id) });
      toast.success(t('applications.messages.deleted'));
      // Navigate away before closing the dialog
      setSelectedId(null);
      setDeletingFromDetail(null);
    } catch {
      toast.error(t('applications.messages.errorDelete'));
    } finally {
      setDeleting(false);
    }
  };

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedId && !editingFromDetail) {
    const selectedApp = f.entities.find((a) => a.id === selectedId);
    return (
      <>
        <ApplicationDetailScreen
          applicationId={selectedId}
          onClose={() => setSelectedId(null)}
          onEdit={() => setEditingFromDetail(selectedApp ?? null)}
          onDelete={() => setDeletingFromDetail(selectedApp ?? null)}
          queryEnabled={!deletingFromDetail}
        />
        <AppDeleteDialog
          open={!!deletingFromDetail}
          onClose={() => setDeletingFromDetail(null)}
          onConfirm={handleDeleteFromDetail}
          itemName={deletingFromDetail?.name}
          itemType={t('applications.itemType')}
          loading={deleting}
        />
      </>
    );
  }

  // ── Edit from detail — render form directly ────────────────────────────────
  if (editingFromDetail) {
    return (
      <ApplicationForm
        item={editingFromDetail}
        onClose={() => {
          setEditingFromDetail(null);
          setSelectedId(editingFromDetail.id); // return to detail
        }}
        submitting={false}
        mode="page"
        onSave={async (data: CreateApplicationData) => {
          await f.update(editingFromDetail.id, data);
          setEditingFromDetail(null);
          setSelectedId(editingFromDetail.id); // return to detail after save
        }}
      />
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <AdminCrudScreen<Application>
      title={t('applications.title')}
      icon="📱"
      itemType={t('applications.itemType')}
      entities={f.entities}
      loading={f.loading}
      columns={columns}
      searchFields={['name', 'version', 'description']}
      getItemName={(a) => a.name}
      onDelete={(id) => f.remove(id)}
      onRefresh={f.refetch}
      onExport={handleExport}
      exporting={exporting}
      searchPlaceholder={t('applications.searchPlaceholder')}
      emptyMessage={t('applications.emptyMessage')}
      emptyFilteredMessage={t('applications.emptyFilteredMessage')}
      addLabel={t('applications.addTitle')}
      exportLabel={t('common.exportPdf')}
      exportingLabel={t('common.exporting')}
      refreshLabel={t('common.refresh')}
      refreshingLabel={t('common.refreshing')}
      deleteSuccessMessage={t('applications.messages.deleted')}
      onRowPress={(app) => setSelectedId(app.id)}
      renderForm={(item, onClose) => (
        <ApplicationForm
          item={item}
          onClose={onClose}
          submitting={f.ui.submitting}
          mode="page"
          onSave={async (data: CreateApplicationData) => {
            if (item) await f.update(item.id, data);
            else      await f.create(data);
            onClose();
          }}
        />
      )}
    />
  );
};

export default ApplicationsScreen;
