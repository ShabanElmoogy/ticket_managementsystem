import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAuthStore } from '../../../stores/authStore';
import { apiService, type Ticket } from '../../../services/api';

interface TicketReminderProps {
  onTicketClick: (ticket: Ticket) => void;
}

const TicketReminder: React.FC<TicketReminderProps> = ({ onTicketClick }) => {
  const { user, token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (!token || user?.role !== 'EMPLOYEE') return;

    const fetchOpenTickets = async () => {
      try {
        const tickets = await apiService.getTickets(token, {});
        const nonClosedTickets = tickets.filter(
          (ticket) => ticket.status !== 'CLOSED' && ticket.assignedTo?.id === user?.id
        );
        
        if (nonClosedTickets.length > 0) {
          setOpenTickets(nonClosedTickets);
          setOpen(true);
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    // Show immediately on mount
    fetchOpenTickets();

    // Set up interval to show every minute
    const interval = setInterval(fetchOpenTickets, 60000);

    return () => clearInterval(interval);
  }, [token, user]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleTicketClick = (ticket: Ticket) => {
    onTicketClick(ticket);
    setOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'RESOLVED': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  if (!open || openTickets.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          📋 Reminder: You have {openTickets.length} open ticket{openTickets.length > 1 ? 's' : ''}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Please complete these tickets to keep your workload up to date:
        </Typography>
        <List>
          {openTickets.map((ticket) => (
            <ListItem
              key={ticket.id}
              button
              onClick={() => handleTicketClick(ticket)}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {ticket.title}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={ticket.status.replace('_', ' ')}
                      color={getStatusColor(ticket.status) as any}
                      size="small"
                    />
                    <Chip
                      label={ticket.priority}
                      color={getPriorityColor(ticket.priority) as any}
                      variant="outlined"
                      size="small"
                    />
                    {ticket.dueDate && (
                      <Chip
                        label={`Due: ${new Date(ticket.dueDate).toLocaleDateString()}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default TicketReminder;