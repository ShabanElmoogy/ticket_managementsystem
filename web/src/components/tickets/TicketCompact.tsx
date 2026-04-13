import React from 'react';
import {
  Box, Chip, Typography, Tooltip, IconButton, useTheme,
} from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Ticket } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';

const STATUS_COLOR: Record<string, 'primary' | 'warning' | 'success' | 'default'> = {
  OPEN: 'primary', IN_PROGRESS: 'warning', RESOLVED: 'success', CLOSED: 'default',
};
const PRIORITY_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  LOW: 'success', MEDIUM: 'warning', HIGH: 'error', URGENT: 'error',
};

interface Props {
  ticket: Ticket;
  onTicketClick: (t: Ticket) => void;
}

const TicketCompact: React.FC<Props> = ({ ticket, onTicketClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isOverdue =
    ticket.dueDate &&
    new Date(ticket.dueDate) < new Date() &&
    !['RESOLVED', 'CLOSED'].includes(ticket.status);

  return (
    <Box
      onClick={() => onTicketClick(ticket)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1,
        cursor: 'pointer',
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:hover': { bgcolor: 'action.hover' },
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Priority bar */}
      <Box
        sx={{
          width: 4,
          height: 32,
          borderRadius: 1,
          flexShrink: 0,
          bgcolor:
            ticket.priority === 'LOW' ? 'success.main' :
            ticket.priority === 'MEDIUM' ? 'warning.main' : 'error.main',
        }}
      />

      {/* Title */}
      <Tooltip title={ticket.title}>
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
            color: isOverdue ? 'error.main' : 'text.primary',
          }}
        >
          {ticket.title}
        </Typography>
      </Tooltip>

      {/* Assignee */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ flexShrink: 0, minWidth: 80, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}
      >
        {ticket.assignedTo?.name ?? '—'}
      </Typography>

      {/* Status */}
      <Chip
        label={ticket.status.replace('_', ' ')}
        color={STATUS_COLOR[ticket.status] ?? 'default'}
        size="small"
        sx={{ flexShrink: 0, fontSize: '0.7rem', height: 22 }}
      />

      {/* Priority */}
      <Chip
        label={ticket.priority}
        color={PRIORITY_COLOR[ticket.priority] ?? 'default'}
        size="small"
        variant="outlined"
        sx={{ flexShrink: 0, fontSize: '0.7rem', height: 22, display: { xs: 'none', md: 'flex' } }}
      />

      {/* Due date */}
      <Typography
        variant="caption"
        color={isOverdue ? 'error.main' : 'text.secondary'}
        sx={{ flexShrink: 0, minWidth: 72, textAlign: 'right', display: { xs: 'none', lg: 'block' } }}
      >
        {ticket.dueDate ? formatDate(ticket.dueDate) : '—'}
      </Typography>

      <Tooltip title="Open full page">
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${ticket.id}`); }}>
          <OpenInNewIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default TicketCompact;
