import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Divider,
  IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import { Add, LinkOff, OpenInNew, ConfirmationNumber } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { epicsApi } from '../api/epics';
import LinkTicketDialog from './LinkTicketDialog';
import type { LinkedTicket } from '../../../services/api/types';

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  PROGRAMMING: 'info',
  UNDER_DEVELOPMENT: 'info',
  CODE_REVIEW: 'info',
  TESTING: 'info',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const PRIORITY_COLOR: Record<string, 'default' | 'warning' | 'error' | 'success'> = {
  LOW: 'success',
  MEDIUM: 'default',
  HIGH: 'warning',
  URGENT: 'error',
};

interface Props {
  epicId: string;
  isAdmin: boolean;
}

const EpicLinkedTickets: React.FC<Props> = ({ epicId, isAdmin }) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['epics', epicId, 'tickets'],
    queryFn: () => epicsApi.listLinkedTickets(epicId),
    staleTime: 0,
  });

  const unlinkMutation = useMutation({
    mutationFn: (ticketId: string) => epicsApi.unlinkTicket(epicId, ticketId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epics', epicId, 'tickets'] }),
  });

  const linkedIds = tickets.map((t) => t.id);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, mt: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <ConfirmationNumber color="action" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>
            Linked Tickets
          </Typography>
          {tickets.length > 0 && (
            <Chip label={tickets.length} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
          )}
        </Box>
        {isAdmin && (
          <Button
            size="small"
            startIcon={<Add />}
            onClick={() => setLinkOpen(true)}
            variant="outlined"
          >
            Link Ticket
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {isLoading && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!isLoading && tickets.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          No tickets linked yet.{isAdmin ? ' Use "Link Ticket" to attach hotfixes or unplanned work.' : ''}
        </Typography>
      )}

      {tickets.map((ticket: LinkedTicket) => (
        <Box
          key={ticket.id}
          display="flex"
          alignItems="center"
          gap={1}
          py={1}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
        >
          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
              <Typography
                variant="body2"
                fontWeight={500}
                noWrap
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                {ticket.title}
              </Typography>
            </Box>
            <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
              <Chip label={ticket.status.replace(/_/g, ' ')} size="small" color={STATUS_COLOR[ticket.status] ?? 'default'} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
              <Chip label={ticket.priority} size="small" color={PRIORITY_COLOR[ticket.priority] ?? 'default'} variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
              {ticket.customerName && (
                <Chip label={ticket.customerName} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
              )}
              {ticket.assignedToName && (
                <Chip label={ticket.assignedToName} size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
              )}
            </Box>
          </Box>

          <Tooltip title="Open ticket">
            <IconButton size="small" onClick={() => navigate(`/tickets/${ticket.id}`)}>
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>

          {isAdmin && (
            <Tooltip title="Unlink ticket">
              <IconButton
                size="small"
                color="error"
                onClick={() => unlinkMutation.mutate(ticket.id)}
                disabled={unlinkMutation.isPending}
              >
                <LinkOff fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ))}

      <LinkTicketDialog
        open={linkOpen}
        epicId={epicId}
        linkedTicketIds={linkedIds}
        onClose={() => setLinkOpen(false)}
        onLinked={() => qc.invalidateQueries({ queryKey: ['epics', epicId, 'tickets'] })}
      />
    </Paper>
  );
};

export default EpicLinkedTickets;
