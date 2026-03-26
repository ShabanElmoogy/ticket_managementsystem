import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Fade,
  useTheme,
  useMediaQuery,
  Button,
  Collapse,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { type Ticket } from '../../services/api';
import TicketPost from './TicketPost';
import BulkActionBar from './BulkActionBar';

interface TicketFeedProps {
  tickets: Ticket[];
  onTakeTicket: (ticketId: string) => void;
  onUpdateStatus: (ticketId: string, status: Ticket['status']) => void;
  onAddComment: (ticketId: string, content: string) => void;
  onTicketClick: (ticket: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onBulkUpdateStatus?: (ids: string[], status: Ticket['status']) => Promise<void>;
  isAdmin?: boolean;
}

const TicketFeed: React.FC<TicketFeedProps> = ({
  tickets,
  onTakeTicket,
  onUpdateStatus,
  onAddComment,
  onTicketClick,
  onDeleteTicket,
  onBulkUpdateStatus,
  isAdmin = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const allSelected = tickets.length > 0 && selectedIds.length === tickets.length;
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : tickets.map((t) => t.id));

  const handleBulkStatus = async (status: Ticket['status']) => {
    if (onBulkUpdateStatus) {
      await onBulkUpdateStatus(selectedIds, status);
      setSelectedIds([]);
    }
  };
  
  // For mobile, show only first 5 tickets initially
  const ticketsToShow = isMobile && !showAllTickets ? tickets.slice(0, 5) : tickets;
  const hasMoreTickets = isMobile && tickets.length > 5;
  if (tickets.length === 0) {
    return (
      <Fade in={true}>
        <Paper 
          sx={{ 
            p: { xs: 3, sm: 6 }, 
            textAlign: 'center',
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: (theme) => theme.palette.mode === 'dark' 
              ? '2px dashed rgba(255, 255, 255, 0.2)'
              : '2px dashed #cbd5e1',
            borderRadius: { xs: 2, sm: 3 },
            mt: 2,
            mx: { xs: 0, sm: 0 },
          }}
        >
          <AssignmentIcon sx={{ 
            fontSize: { xs: 48, sm: 64 }, 
            color: 'text.secondary', 
            mb: 2 
          }} />
          <Typography 
            variant="h5" 
            color="textSecondary" 
            gutterBottom
            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
          >
            No tickets in your feed
          </Typography>
          <Typography 
            variant="body2" 
            color="textSecondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            When tickets are created, they'll appear here like posts in your timeline.
          </Typography>
        </Paper>
      </Fade>
    );
  }

  return (
    <Box>
      {/* Select all row — only for admins */}
      {isAdmin && onBulkUpdateStatus && tickets.length > 0 && (
        <Box display="flex" alignItems="center" sx={{ mb: 1, px: 1 }}>
          <Tooltip title={allSelected ? 'Deselect all' : 'Select all'}>
            <Checkbox
              checked={allSelected}
              indeterminate={selectedIds.length > 0 && !allSelected}
              onChange={toggleSelectAll}
              size="small"
            />
          </Tooltip>
          <Typography variant="caption" color="text.secondary">
            {selectedIds.length > 0 ? `${selectedIds.length} of ${tickets.length} selected` : 'Select all'}
          </Typography>
        </Box>
      )}

      {/* Bulk action bar */}
      {isAdmin && onBulkUpdateStatus && (
        <BulkActionBar
          selectedIds={selectedIds}
          onBulkStatus={handleBulkStatus}
          onClear={() => setSelectedIds([])}
        />
      )}

      {/* Show initial tickets */}
      {ticketsToShow.map((ticket, index) => (
        <Fade key={ticket.id} in={true} timeout={300 + index * 100}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            {isAdmin && onBulkUpdateStatus && (
              <Checkbox
                checked={selectedIds.includes(ticket.id)}
                onChange={() => toggleSelect(ticket.id)}
                onClick={(e) => e.stopPropagation()}
                size="small"
                sx={{ mt: 2 }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <TicketPost
                ticket={ticket}
                onTakeTicket={onTakeTicket}
                onUpdateStatus={onUpdateStatus}
                onAddComment={onAddComment}
                onTicketClick={onTicketClick}
                onDeleteTicket={onDeleteTicket}
              />
            </Box>
          </Box>
        </Fade>
      ))}

      {/* Show remaining tickets in collapsible section (mobile only) */}
      {hasMoreTickets && (
        <>
          <Collapse in={showAllTickets}>
            <Box>
              {tickets.slice(5).map((ticket, index) => (
                <Fade key={ticket.id} in={showAllTickets} timeout={300 + index * 100}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    {isAdmin && onBulkUpdateStatus && (
                      <Checkbox
                        checked={selectedIds.includes(ticket.id)}
                        onChange={() => toggleSelect(ticket.id)}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        sx={{ mt: 2 }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <TicketPost
                        ticket={ticket}
                        onTakeTicket={onTakeTicket}
                        onUpdateStatus={onUpdateStatus}
                        onAddComment={onAddComment}
                        onTicketClick={onTicketClick}
                        onDeleteTicket={onDeleteTicket}
                      />
                    </Box>
                  </Box>
                </Fade>
              ))}
            </Box>
          </Collapse>

          {/* Load More Button */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mt: 2, 
            mb: 1 
          }}>
            <Button
              variant="outlined"
              onClick={() => setShowAllTickets(!showAllTickets)}
              startIcon={showAllTickets ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                },
              }}
            >
              {showAllTickets 
                ? 'Show Less' 
                : `Show ${tickets.length - 5} More Ticket${tickets.length - 5 === 1 ? '' : 's'}`
              }
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default TicketFeed;
