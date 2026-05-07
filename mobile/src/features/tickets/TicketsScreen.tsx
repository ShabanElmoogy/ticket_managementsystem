/**
 * TicketsScreen — 3-state orchestration (list → detail → edit).
 *
 * State machine:
 *   list            — default, shows AdminCrudScreen with TicketCard (Feed) or DataCard (Grid/Compact)
 *   detail          — selectedId is set, shows TicketDetailScreen
 *   edit            — editingFromDetail is set, shows TicketForm
 *
 * Architecture:
 *  - FeatureErrorBoundary wraps ALL 3 view states
 *  - Feed mode: TicketCard as row renderer via renderCard prop
 *  - Grid/Compact modes: DataCard (AdminCrudScreen default via columns)
 *  - PDF export button in header (admin only)
 *  - Delete uses isAssociatedDataError + pendingForceTarget pattern
 *  - queryEnabled={!deletingFromDetail} on detail screen
 *
 * Follows CustomersScreen.tsx pattern exactly.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '@/src/stores/uiStore';
import { useThemeColors } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/authStore';
import { useToast } from '@/src/shared/hooks/useToast';
import { useErrorHandler } from '@/src/shared/hooks/useErrorHandler';
import { isAssociatedDataError } from '@/src/services/api/errorCodes';
import { networkEvents } from '@/src/services/api/networkEvents';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { ConfirmDeleteDialog } from '@/src/shared/components';
import AdminCrudScreen from '@/src/features/admin/shared/AdminCrudScreen';
import TicketCard from '@/src/shared/components/display/TicketCard/index';
import TicketDetailScreen from '@/src/features/tickets/components/TicketDetailScreen';
import TicketForm from '@/src/features/tickets/components/TicketForm';
import { ticketsKeys } from '@/src/features/tickets/api/tickets';
import { useTickets } from '@/src/features/tickets/hooks/useTickets';
import type { Ticket, CreateTicketData } from '@/src/services/api/types/ticket';

const TicketsScreen: React.FC = () => {
  const { t }       = useTranslation();
  const c           = useThemeColors();
  const toast       = useToast();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  const currentUser     = useAuthStore((s) => s.user);
  const tenantSuspended = useAuthStore((s) => s.tenantSuspended);
  const isAdmin         = currentUser?.role === 'TENANT_ADMIN';
  const isEmployee      = currentUser?.role === 'EMPLOYEE';

  const { f, columns, exporting, handleExport, selectedId, setSelectedId } = useTickets();

  // ── Detail → Edit state ────────────────────────────────────────────────────
  const [editingFromDetail, setEditingFromDetail] = useState<Ticket | null>(null);

  // ── Detail → Delete state ──────────────────────────────────────────────────
  const [deletingFromDetail, setDeletingFromDetail] = useState<Ticket | null>(null);
  const [deleting,           setDeleting]           = useState(false);

  // ── Force-delete escalation ────────────────────────────────────────────────
  const pendingForceTarget = useRef<Ticket | null>(null);

  useEffect(() => {
    const unsub = networkEvents.onOkPress(() => {
      if (pendingForceTarget.current) {
        // For tickets, we don't have a force-delete endpoint — just navigate away
        pendingForceTarget.current = null;
      }
    });
    return () => { unsub(); };
  }, []);

  // ── Delete from detail ─────────────────────────────────────────────────────
  const handleDeleteFromDetail = async () => {
    if (!deletingFromDetail) return;
    setDeleting(true);
    try {
      await f.remove(deletingFromDetail.id);
      // Remove detail query — prevents refetch of deleted resource
      queryClient.removeQueries({ queryKey: ticketsKeys.detail(deletingFromDetail.id) });
      toast.success(t('tickets.messages.deleted'));
      setSelectedId(null);
      setDeletingFromDetail(null);
    } catch (error) {
      setDeletingFromDetail(null);
      if (isAssociatedDataError(error)) {
        pendingForceTarget.current = deletingFromDetail;
      } else {
        handleError(error, { feature: 'tickets', operation: 'delete' });
      }
    } finally {
      setDeleting(false);
    }
  };

  // ── Error handler for feature-level errors ─────────────────────────────────
  const handleFeatureError = (error: Error, errorInfo: any, errorId: string) => {
    handleError(error, {
      feature: 'tickets',
      operation: 'feature-boundary',
      metadata: { errorId, componentStack: errorInfo.componentStack },
    });
  };

  // ── canUpdateStatus helper ─────────────────────────────────────────────────
  const getCanUpdateStatus = (ticket: Ticket): boolean => {
    if (isAdmin) return true;
    const PROGRAMMING_STATUSES = ['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING'];
    return (
      currentUser?.id === ticket.assignedToId &&
      !PROGRAMMING_STATUSES.includes(ticket.status)
    );
  };

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedId && !editingFromDetail) {
    const selectedTicket = f.entities.find((tk) => tk.id === selectedId);
    return (
      <FeatureErrorBoundary featureName="Tickets" onError={handleFeatureError}>
        <TicketDetailScreen
          ticketId={selectedId}
          onBack={() => setSelectedId(null)}
          onEdit={() => setEditingFromDetail(selectedTicket ?? null)}
        />
        <ConfirmDeleteDialog
          open={!!deletingFromDetail}
          onClose={() => setDeletingFromDetail(null)}
          onConfirm={handleDeleteFromDetail}
          itemName={deletingFromDetail?.title}
          itemType={t('tickets.itemType')}
          loading={deleting}
        />
      </FeatureErrorBoundary>
    );
  }

  // ── Edit from detail ────────────────────────────────────────────────────────
  if (editingFromDetail) {
    return (
      <FeatureErrorBoundary featureName="Tickets" onError={handleFeatureError}>
        <TicketForm
          item={editingFromDetail}
          onClose={() => {
            setEditingFromDetail(null);
            setSelectedId(editingFromDetail.id); // return to detail
          }}
          submitting={false}
          mode="page"
          onSave={async (data: CreateTicketData) => {
            await f.update(editingFromDetail.id, data);
            // TicketForm calls onClose() after success — navigates back to detail
          }}
        />
      </FeatureErrorBoundary>
    );
  }

  // ── List view (default) ────────────────────────────────────────────────────
  return (
    <FeatureErrorBoundary featureName="Tickets" onError={handleFeatureError}>
      <AdminCrudScreen<Ticket>
        title={t('tickets.title')}
        icon="ticket-outline"
        itemType={t('tickets.itemType')}
        entities={f.entities}
        loading={f.loading}
        columns={columns}
        searchFields={['title', 'description']}
        getItemName={(tk) => tk.title}
        onDelete={(id) => f.remove(id)}
        onRefresh={f.refetch}
        onExport={isAdmin ? handleExport : undefined}
        exporting={exporting}
        searchPlaceholder={t('tickets.searchPlaceholder')}
        emptyMessage={t('tickets.emptyMessage')}
        emptyFilteredMessage={t('tickets.emptyFilteredMessage')}
        addLabel={t('tickets.addTitle')}
        exportLabel={t('common.exportPdf')}
        exportingLabel={t('common.exporting')}
        refreshLabel={t('common.refresh')}
        refreshingLabel={t('common.refreshing')}
        deleteSuccessMessage={t('tickets.messages.deleted')}
        onRowPress={(ticket) => setSelectedId(ticket.id)}
        // Feed mode: use TicketCard as the row renderer
        renderCard={(ticket, onEdit, onDelete) => (
          <TicketCard
            ticket={ticket}
            resolvedColors={c}
            viewMode="feed"
            onPress={(tk) => setSelectedId(tk.id)}
            onStatusChange={(id, status) => {
              f.update(id, { status } as any);
            }}
            onDelete={isAdmin ? (id) => {
              const target = f.entities.find((tk) => tk.id === id);
              if (target) setDeletingFromDetail(target);
            } : undefined}
            onRestore={isAdmin ? (id) => {
              // Restore is handled via ticketsApi directly
              import('@/src/features/tickets/api/tickets').then(({ ticketsApi }) => {
                ticketsApi.restoreTicket(id).then(() => {
                  f.refetch();
                  toast.success(t('tickets.messages.updated'));
                }).catch((err) => {
                  handleError(err, { feature: 'tickets', operation: 'restore' });
                });
              });
            } : undefined}
            onReassign={isAdmin ? (id) => {
              // Reassign is handled by navigating to detail
              setSelectedId(id);
            } : undefined}
            onAssignProgrammer={isAdmin ? (id) => {
              setSelectedId(id);
            } : undefined}
            onActivityPress={(id) => setSelectedId(id)}
            canUpdateStatus={getCanUpdateStatus(ticket)}
            isAdmin={isAdmin}
            isEmployee={isEmployee}
            currentUserId={currentUser?.id ?? ''}
            tenantSuspended={tenantSuspended}
          />
        )}
        renderForm={(item, onClose) => (
          <TicketForm
            item={item}
            onClose={onClose}
            submitting={f.ui.submitting}
            mode="page"
            onSave={async (data: CreateTicketData) => {
              if (item) await f.update(item.id, data);
              else      await f.create(data);
            }}
          />
        )}
      />
    </FeatureErrorBoundary>
  );
};

export default TicketsScreen;
