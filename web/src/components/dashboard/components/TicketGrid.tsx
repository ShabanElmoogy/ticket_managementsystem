import React from 'react';
import {
  Grid, Card, CardContent, CardActions, Typography, Button,
  Box, Chip, Paper, Avatar, Fade, Grow, Tooltip, IconButton,
} from '@mui/material';
import {
  Person as PersonIcon, Schedule as ScheduleIcon,
  Assignment as AssignmentIcon, OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Ticket } from '../../../services/api';
import { formatDate } from '../../../shared/utils/dateUtils';

interface TicketGridProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onTakeTicket: (ticketId: string) => void;
  userRole: string;
}

const TicketGrid: React.FC<TicketGridProps> = ({
  tickets, onTicketClick, onTakeTicket, userRole,
}) => {
  const navigate = useNavigate();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'URGENT': return 'error';
      default: return 'default';
    }
  };

  if (tickets.length === 0) {
    return (
      <Fade in={true}>
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 3,
          }}
        >
          <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="textSecondary" gutterBottom>
            No tickets found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your filters or create a new ticket to get started.
          </Typography>
        </Paper>
      </Fade>
    );
  }

  return (
    <Grid container spacing={3}>
      {tickets.map((ticket, index) => (
        <Grid size={{xs:12,md:6,lg:4}} key={ticket.id}>
          <Grow in={true} timeout={300 + index * 100}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { 
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease-in-out',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: getPriorityColor(ticket.priority) === 'success' ? 'linear-gradient(90deg, #10b981, #34d399)' :
                             getPriorityColor(ticket.priority) === 'warning' ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                             'linear-gradient(90deg, #ef4444, #f87171)',
                  transition: 'height 0.3s ease-in-out',
                },
              }}
              onClick={() => onTicketClick(ticket)}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      flexGrow: 1, 
                      pr: 1,
                      fontWeight: 600,
                      color: 'text.primary',
                      lineHeight: 1.3,
                    }}
                  >
                    {ticket.title}
                  </Typography>
                  <Box display="flex" gap={1} flexDirection="column">
                    <Chip 
                      label={ticket.status.replace('_', ' ')} 
                      color={getStatusColor(ticket.status) as 'primary' | 'warning' | 'success' | 'default'}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        '& .MuiChip-label': {
                          px: 1.5,
                        },
                      }}
                    />
                    <Chip 
                      label={ticket.priority} 
                      color={getPriorityColor(ticket.priority) as 'success' | 'warning' | 'error' | 'default'}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        borderWidth: 2,
                      }}
                    />
                  </Box>
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="textSecondary" 
                  sx={{ 
                    mb: 3,
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {ticket.description}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto' }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {ticket.assignedTo ? (
                      <>
                        <Avatar 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            fontSize: '0.75rem',
                            backgroundColor: 'primary.main',
                          }}
                        >
                          {ticket.assignedTo.name.charAt(0)}
                        </Avatar>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                          {ticket.assignedTo.name}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="textSecondary">
                          Unassigned
                        </Typography>
                      </>
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(ticket.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              
              {!ticket.assignedTo && userRole === 'EMPLOYEE' && (
                <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    onClick={(e) => { e.stopPropagation(); onTakeTicket(ticket.id); }}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
                    }}
                  >
                    Take Ticket
                  </Button>
                  <Tooltip title="Open full page">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${ticket.id}`); }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              )}

              {(ticket.assignedTo || userRole !== 'EMPLOYEE') && (
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                  <Tooltip title="Open full page">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); navigate(`/tickets/${ticket.id}`); }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              )}
            </Card>
          </Grow>
        </Grid>
      ))}
    </Grid>
  );
};

export default TicketGrid;