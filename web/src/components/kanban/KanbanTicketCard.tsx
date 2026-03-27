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
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Comment as CommentIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { isBefore, addDays } from 'date-fns';
import { formatDate } from '../../utils/dateUtils';
import type { KanbanTicket, Priority } from './types/types';
import TicketDetailsDialog from '../tickets/TicketDetailsDialog';
import WhatsAppButton from '../WhatsAppButton';

import { useTenantSuspended } from '../../stores';

interface KanbanTicketCardProps {
  ticket: KanbanTicket;
  isDragging: boolean;
  boardId: string;
}

const KanbanTicketCard: React.FC<KanbanTicketCardProps> = ({
  ticket,
  isDragging
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const tenantSuspended = useTenantSuspended();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    if (tenantSuspended) return;
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = () => {
    setDetailsOpen(true);
  };

  const getPriorityColor = (priority: Priority, isDark = false) => {
    if (isDark) {
      switch (priority) {
        case 'URGENT': return '#f87171';
        case 'HIGH': return '#fbbf24';
        case 'MEDIUM': return '#60a5fa';
        case 'LOW': return '#34d399';
        default: return '#9ca3af';
      }
    }
    switch (priority) {
      case 'URGENT': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#3b82f6';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const getPriorityIcon = (priority: Priority) => {
    const color = getPriorityColor(priority, isDarkMode);
    return <FlagIcon sx={{ color, fontSize: 16 }} />;
  };

  const getDueDateStatus = () => {
    if (!ticket.dueDate) return null;

    const dueDate = new Date(ticket.dueDate);
    const now = new Date();
    const tomorrow = addDays(now, 1);

    if (isBefore(dueDate, now)) {
      return { status: 'overdue', color: isDarkMode ? '#f87171' : '#ef4444' };
    } else if (isBefore(dueDate, tomorrow)) {
      return { status: 'due-soon', color: isDarkMode ? '#fbbf24' : '#f59e0b' };
    }
    return { status: 'normal', color: isDarkMode ? '#34d399' : '#10b981' };
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
                defaultPhone={''}
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

          {/* Overdue Badge */}
          {dueDateStatus?.status === 'overdue' && !['RESOLVED', 'CLOSED'].includes(ticket.status) && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                px: 0.75,
                py: 0.25,
                mb: 1,
                borderRadius: 1,
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))',
                border: '1px solid',
                borderColor: isDarkMode ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.3)',
              }}
            >
              <ScheduleIcon sx={{ fontSize: 11, color: isDarkMode ? '#f87171' : '#ef4444' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: isDarkMode ? '#f87171' : '#ef4444', lineHeight: 1 }}>
                OVERDUE
              </Typography>
            </Box>
          )}

          {/* Labels */}
          {ticket.labels && ticket.labels.length > 0 && (
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
                        backgroundColor: progressPercentage > 100 ? '#ef4444' : '#10b981'
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
              {ticket._count && ticket._count.comments > 0 && (
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
              <Tooltip title={`Due: ${formatDate(ticket.dueDate)}`}>
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
                    {formatDate(ticket.dueDate)}
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
        <MenuItem onClick={handleMenuClose} disabled={tenantSuspended}>
          Edit Ticket
        </MenuItem>
        <MenuItem onClick={handleMenuClose} disabled={tenantSuspended}>
          Add Label
        </MenuItem>
        <MenuItem onClick={handleMenuClose} disabled={tenantSuspended}>
          Set Due Date
        </MenuItem>
      </Menu>

      {/* Ticket Details Dialog */}
      <TicketDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        ticket={ticket as any}
        onUpdateStatus={() => {}}
        token={''}
      />
    </>
  );
};

export default KanbanTicketCard;