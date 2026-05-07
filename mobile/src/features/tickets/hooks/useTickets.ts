/**
 * useTickets — useAdminFeature wrapper for the Tickets feature.
 *
 * Wraps useAdminFeature<Ticket, CreateTicketData> with:
 *  - ticketsApi CRUD methods
 *  - i18n messages for success/error toasts
 *  - Column definitions for Grid/Compact view modes
 *  - PDF export handler
 *  - selectedId state for 3-state orchestration (list → detail → edit)
 *
 * Usage:
 *   const { f, columns, exporting, handleExport, selectedId, setSelectedId } = useTickets();
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminFeature } from '@/src/shared/hooks/useAdminFeature';
import { ticketsApi, ticketsKeys } from '@/src/features/tickets/api/tickets';
import { exportTicketPdf } from '@/src/features/tickets/utils/exportTicketPdf';
import { getTicketColumns } from '@/src/features/tickets/components/ticketColumns';
import type { Ticket, CreateTicketData } from '@/src/services/api/types/ticket';

export function useTickets() {
  const { t } = useTranslation();
  const [exporting,  setExporting]  = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Rebuild columns when language changes
  const columns = useMemo(() => getTicketColumns(t), [t]);

  const f = useAdminFeature<Ticket, CreateTicketData>({
    entityName: 'tickets',
    queryKey: ticketsKeys.all,
    api: {
      getAll:  ticketsApi.getTickets.bind(ticketsApi),
      create:  ticketsApi.createTicket.bind(ticketsApi),
      update:  ticketsApi.updateTicket.bind(ticketsApi),
      delete:  ticketsApi.deleteTicket.bind(ticketsApi),
    },
    messages: {
      success: {
        created: t('tickets.messages.created'),
        updated: t('tickets.messages.updated'),
        deleted: t('tickets.messages.deleted'),
      },
      error: {
        create: t('tickets.messages.errorCreate'),
        update: t('tickets.messages.errorUpdate'),
        delete: t('tickets.messages.errorDelete'),
      },
      titles: {
        create: t('tickets.addTitle'),
        edit:   t('tickets.editTitle'),
      },
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try { await exportTicketPdf(f.entities, t); }
    finally { setExporting(false); }
  };

  return { f, columns, exporting, handleExport, selectedId, setSelectedId };
}
