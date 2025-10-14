import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Comment as CommentIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import type { KanbanTicket, Priority } from '../../types/kanban';
import TicketDetailsDialog from '../tickets/TicketDetailsDialog';
import WhatsAppButton from '../WhatsAppButton';

interface KanbanTicketCardProps {
  ticket: KanbanTicket;
  isDragging: boolean;
  boardId: string;
}

const KanbanTicketCard: React.FC<KanbanTicketCardProps> = ({
  ticket,
  isDragging,
  boardId
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = () => {
    setDetailsOpen(true);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'URGENT': return '#f44336';
      case 'HIGH': return '#ff9800';
      case 'MEDIUM': return '#2196f3';
      case 'LOW': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    const color = getPriorityColor(priority);
    return <FlagIcon sx={{ color, fontSize: 16 }} />;
  };

  const getDueDateStatus = () => {
    if (!ticket.dueDate) return null;
    
    const dueDate = new Date(ticket.dueDate);
    const now = new Date();
    const tomorrow = addDays(now, 1);
    
    if (isBefore(dueDate, now)) {
      return { status: 'overdue', color: '#f44336' };
    } else if (isBefore(dueDate, tomorrow)) {
      return { status: 'due-soon', color: '#ff9800' };
    }
    return { status: 'normal', color: '#4caf50' };
  };

  const getProgressPercentage = () => {
    if (!ticket.estimatedHours || !ticket.actualHours) return 0;
    return Math.min((ticket.actualHours / ticket.estimatedHours) * 100, 100);
  };

  const dueDateStatus = getDueDateStatus();
  const progressPercentage = getProgressPercentage();

  return (
    <>
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: isDragging ? 'rotate(5deg)' : 'none',
          opacity: isDragging ? 0.8 : 1,
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)'
          }
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header with priority and menu */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box display="flex" alignItems="center" gap={0.5}>
              {getPriorityIcon(ticket.priority)}
              <Typography variant="caption" color="text.secondary">
                #{ticket.id.slice(-6)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <WhatsAppButton
                ticket={ticket}
                defaultPhone={ticket.assignedTo?.phone || ''}
                defaultMessage={`🎫 Ticket Update\n\nID: ${ticket.id}\nTitle: ${ticket.title}\nPriority: ${ticket.priority}\nStatus: ${ticket.status}\n\nPlease check the ticket management system for more details.`}
                size="small"
                onSent={(result) => console.log('WhatsApp message opened:', result)}
                onError={(error) => console.error('WhatsApp error:', error)}
              />
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{ p: 0.5 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Title */}
          <Typography
            variant="subtitle2"
            component="h3"
            sx={{
              fontWeight: 600,
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {ticket.title}
          </Typography>

          {/* Labels */}
          {ticket.labels.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
              {ticket.labels.slice(0, 3).map((ticketLabel) => (
                <Chip
                  key={ticketLabel.id}
                  label={ticketLabel.label.name}
                  size="small"
                  sx={{
                    backgroundColor: ticketLabel.label.color,
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              ))}
              {ticket.labels.length > 3 && (
                <Chip
                  label={`+${ticket.labels.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          )}

          {/* Time tracking info */}
          {(ticket.estimatedHours || ticket.actualHours) && (
            <Box mb={1}>
              {ticket.estimatedHours && ticket.actualHours ? (
                // Show progress bar if both estimated and actual hours exist
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {ticket.actualHours}h / {ticket.estimatedHours}h
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: progressPercentage > 100 ? '#f44336' : '#4caf50'
                      }
                    }}
                  />
                </>
              ) : (
                // Show just estimated hours if no actual hours logged
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {ticket.estimatedHours ? `Est: ${ticket.estimatedHours}h` : `Logged: ${ticket.actualHours}h`}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Footer */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              {/* Assignee */}
              {ticket.assignedTo ? (
                <Tooltip title={ticket.assignedTo.name}>
                  <Avatar
                    sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                  >
                    {ticket.assignedTo.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ) : (
                <Tooltip title="Unassigned">
                  <Avatar sx={{ width: 24, height: 24, backgroundColor: '#e0e0e0' }}>
                    <PersonIcon sx={{ fontSize: 14, color: '#9e9e9e' }} />
                  </Avatar>
                </Tooltip>
              )}

              {/* Comments count */}
              {ticket._count.comments > 0 && (
                <Box display="flex" alignItems="center" gap={0.25}>
                  <CommentIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {ticket._count.comments}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Due date */}
            {ticket.dueDate && (
              <Tooltip title={`Due: ${format(new Date(ticket.dueDate), 'MMM dd, yyyy')}`}>
                <Box 
                  display="flex" 
                  alignItems="center" 
                  gap={0.25}
                  sx={{
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 1,
                    backgroundColor: dueDateStatus?.status === 'overdue' 
                      ? 'rgba(244, 67, 54, 0.1)' 
                      : dueDateStatus?.status === 'due-soon'
                      ? 'rgba(255, 152, 0, 0.1)'
                      : 'transparent'
                  }}
                >
                  <CalendarIcon 
                    sx={{ 
                      fontSize: 14, 
                      color: dueDateStatus?.color || 'text.secondary' 
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: dueDateStatus?.color || 'text.secondary',
                      fontWeight: dueDateStatus?.status === 'overdue' ? 600 : 400,
                      fontSize: '0.7rem'
                    }}
                  >
                    {format(new Date(ticket.dueDate), 'MMM dd')}
                    {dueDateStatus?.status === 'overdue' && ' (Overdue)'}
                    {dueDateStatus?.status === 'due-soon' && ' (Due Soon)'}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={() => { setDetailsOpen(true); handleMenuClose(); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Edit Ticket
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Add Label
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Set Due Date
        </MenuItem>
      </Menu>

      {/* Ticket Details Dialog */}
      <TicketDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        ticketId={ticket.id}
      />
    </>
  );
};

export default KanbanTicketCard;