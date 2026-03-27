import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Grid,
  Chip,
  Paper,
  Box,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, History as HistoryIcon, OpenInFull as MaximizeIcon, CloseFullscreen as MinimizeIcon, Close as CloseIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { ticketsApi, type Ticket, type Comment, type TicketActivity } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { formatDateTime, formatRelativeDuration } from '../../utils/dateUtils';
import AttachmentsPanel from './AttachmentsPanel';
import { useNavigate } from 'react-router-dom';
import WatcherButton from './WatcherButton';
import MentionTextField, { renderWithMentions, extractMentionedUsers, type MentionUser } from './MentionTextField';
import { usersApi } from '../../services/api';

interface TicketDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onUpdateStatus: (ticketId: string, status: Ticket['status']) => void;
  token: string;
}

const TicketDetailsDialog: React.FC<TicketDetailsDialogProps> = ({
  open,
  onClose,
  ticket,
  onUpdateStatus,
  token,
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [actualHoursInput, setActualHoursInput] = useState('');
  const [savingHours, setSavingHours] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(3);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityMaximized, setActivityMaximized] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);

  useEffect(() => {
    usersApi.getEmployees().then((data) => setMentionUsers(data.map((u) => ({ id: u.id, name: u.name })))).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (ticket && open) {
      fetchTicketDetails();
      setVisibleCommentsCount(3);
      setActualHoursInput(ticket.actualHours != null ? String(ticket.actualHours) : '');
    }
  }, [ticket, open]);

  const handleSaveActualHours = async () => {
    if (!ticket) return;
    const val = parseFloat(actualHoursInput);
    if (isNaN(val) || val < 0) return;
    setSavingHours(true);
    try {
      await ticketsApi.updateTicket(ticket.id, { actualHours: val });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      await fetchTicketDetails();
    } catch (e) {
      console.error('Error saving actual hours:', e);
    } finally {
      setSavingHours(false);
    }
  };

  const fetchTicketDetails = async () => {
    if (!ticket) return;

    setLoading(true);
    try {
      const data = await ticketsApi.getTicket(ticket.id);
      setComments(data.comments || []);
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return;

    setAddingComment(true);
    try {
      await ticketsApi.addComment(ticket.id, newComment);
      setNewComment('');
      await fetchTicketDetails();
      setVisibleCommentsCount(3); // Reset to show first 3 comments including the new one
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!ticket) return;
    setDeletingCommentId(commentId);
    try {
      await ticketsApi.deleteComment(ticket.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      window.dispatchEvent(new CustomEvent('commentDeleted', { detail: { ticketId: ticket.id } }));
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleLoadMoreComments = () => {
    setLoadingMoreComments(true);
    setTimeout(() => {
      setVisibleCommentsCount(prev => prev + 3);
      setLoadingMoreComments(false);
    }, 500); // Small delay to show loading state
  };

  if (!ticket) return null;

  const PROGRAMMING_STATUSES = ['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING'];
  const isInProgrammingPhase = PROGRAMMING_STATUSES.includes(ticket.status);

  // Employee cannot update status while ticket is in programmer's hands
  const canUpdateStatus = isAdmin || (!isInProgrammingPhase && ticket.assignedTo?.id === user?.id);

  const getAllowedStatuses = (): Ticket['status'][] => {
    if (isAdmin) return ['OPEN', 'IN_PROGRESS', 'PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'RESOLVED', 'CLOSED'];
    return ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'PROGRAMMING': return 'secondary';
      case 'UNDER_DEVELOPMENT': return 'info';
      case 'CODE_REVIEW': return 'info';
      case 'TESTING': return 'warning';
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

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'CREATED': return '#10b981';
      case 'STATUS_CHANGED': return '#3b82f6';
      case 'PRIORITY_CHANGED': return '#f59e0b';
      case 'ASSIGNED': return '#8b5cf6';
      case 'REASSIGNED': return '#0ea5e9';
      case 'COMMENTED': return '#6366f1';
      case 'COMMENT_DELETED': return '#ef4444';
      case 'DELETED': return '#ef4444';
      case 'RESTORED': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getActivityLabel = (activity: TicketActivity) => {
    switch (activity.action) {
      case 'CREATED': return 'created this ticket';
      case 'STATUS_CHANGED': return `changed status to ${activity.newValue?.replace('_', ' ')}`;
      case 'PRIORITY_CHANGED': return `changed priority to ${activity.newValue}`;
      case 'ASSIGNED': return 'took this ticket';
      case 'REASSIGNED': return activity.description;
      case 'COMMENTED': return activity.newValue ? `commented: ${activity.newValue}` : 'added a comment';
      case 'COMMENT_DELETED': return 'deleted a comment';
      case 'UPDATED': return activity.description || 'updated this ticket';
      case 'DELETED': return 'deleted this ticket';
      case 'RESTORED': return 'restored this ticket';
      default: return activity.description;
    }
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>{ticket.title}</Typography>
          <Tooltip title="Open full page">
            <IconButton size="small" onClick={() => { onClose(); navigate(`/tickets/${ticket.id}`); }} sx={{ mr: 1 }}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View activity log">
            <Box
              onClick={() => setActivityDialogOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.6,
                borderRadius: 2,
                cursor: 'pointer',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(79,70,229,0.25) 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.4)' : 'transparent',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.45)',
                },
                '&:active': { transform: 'translateY(0)' },
              }}
            >
              <HistoryIcon sx={{ fontSize: 16, color: '#fff' }} />
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>
                Activity
              </Typography>
              {activities.length > 0 && (
                <Box
                  sx={{
                    minWidth: 18,
                    height: 18,
                    borderRadius: '9px',
                    bgcolor: 'rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 0.5,
                  }}
                >
                  <Typography sx={{ fontSize: '0.6rem', color: '#fff', fontWeight: 800, lineHeight: 1 }}>
                    {activities.length}
                  </Typography>
                </Box>
              )}
            </Box>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{xs:12,sm:6}}>
            <Typography variant="subtitle2" color="textSecondary">
              Status
            </Typography>
            <Chip 
              label={ticket.status.replace('_', ' ')} 
              color={getStatusColor(ticket.status) as 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning'}
            />
          </Grid>
           <Grid size={{xs:12,sm:6}}>
            <Typography variant="subtitle2" color="textSecondary">
              Priority
            </Typography>
            <Chip 
              label={ticket.priority} 
              color={getPriorityColor(ticket.priority) as 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning'}
              variant="outlined"
            />
          </Grid>
           <Grid size={{xs:12,sm:6}}>
            <Typography variant="subtitle2" color="textSecondary">
              Assigned To
            </Typography>
            <Typography>
              {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
            </Typography>
          </Grid>
           <Grid size={{xs:12,sm:6}}>
            <Typography variant="subtitle2" color="textSecondary">
              Created By
            </Typography>
            <Typography>
              {ticket.createdBy?.name}
            </Typography>
          </Grid>
        </Grid>
        
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Description
        </Typography>
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : '#f8f9fa' 
        }}>
          <Typography>{ticket.description}</Typography>
        </Paper>

        {/* Watchers */}
        <Box sx={{ mb: 3 }}>
          <WatcherButton ticketId={ticket.id} />
        </Box>
        
        {canUpdateStatus && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Update Status
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {getAllowedStatuses().map((status) => (
                <Button
                  key={status}
                  variant={ticket.status === status ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => onUpdateStatus(ticket.id, status)}
                  disabled={ticket.status === status}
                >
                  {status.replace(/_/g, ' ')}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {isAdmin && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              {ticket.programmer ? `Programmer: ${ticket.programmer.name}` : 'No programmer assigned'}
            </Typography>
          </Box>
        )}

        {/* Actual Hours Tracking */}
        {(isAdmin || ticket.assignedTo?.id === user?.id) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Hours Tracking</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              {ticket.estimatedHours != null && (
                <Typography variant="body2" color="text.secondary">
                  Est: <strong>{ticket.estimatedHours}h</strong>
                </Typography>
              )}
              <TextField
                label="Actual Hours"
                type="number"
                size="small"
                value={actualHoursInput}
                onChange={(e) => setActualHoursInput(e.target.value)}
                inputProps={{ min: 0, step: 0.5 }}
                sx={{ width: 140 }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleSaveActualHours}
                disabled={savingHours || actualHoursInput === ''}
              >
                {savingHours ? <CircularProgress size={16} /> : 'Save'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Attachments */}
        <Box sx={{ mb: 3 }}>
          <AttachmentsPanel ticketId={ticket.id} readonly={!canUpdateStatus && !isAdmin} />
        </Box>

        <Typography variant="h6" gutterBottom>
          Comments ({comments.length})
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2 }}>
            {comments.slice(0, visibleCommentsCount).map((comment) => (
              <Paper key={comment.id} sx={{ p: 2, mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">{comment.user.name}</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="textSecondary">
                      {formatDateTime(comment.createdAt)}
                    </Typography>
                    {(comment.userId === user?.id || comment.user?.id === user?.id) && (
                      <Tooltip title="Delete comment">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          sx={{ color: 'error.main' }}
                        >
                          {deletingCommentId === comment.id
                            ? <CircularProgress size={14} />
                            : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                <Typography variant="body2">{renderWithMentions(comment.content, mentionUsers)}</Typography>
              </Paper>
            ))}
            
            {/* See More Comments Button */}
            {comments.length > visibleCommentsCount && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
                <Button
                  variant="text"
                  onClick={handleLoadMoreComments}
                  disabled={loadingMoreComments}
                  sx={{
                    color: 'primary.main',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(59, 130, 246, 0.1)' 
                        : 'rgba(59, 130, 246, 0.05)',
                    },
                  }}
                  startIcon={loadingMoreComments ? (
                    <CircularProgress size={16} />
                  ) : <ExpandMoreIcon />}
                >
                  {loadingMoreComments 
                    ? 'Loading...' 
                    : `See ${Math.min(3, comments.length - visibleCommentsCount)} more comment${comments.length - visibleCommentsCount === 1 ? '' : 's'}`
                  }
                </Button>
              </Box>
            )}
            
            {comments.length === 0 && (
              <Typography variant="body2" color="textSecondary" align="center">
                No comments yet
              </Typography>
            )}
          </Box>
        )}
        
        <Box>
          <MentionTextField
            value={newComment}
            onChange={setNewComment}
            users={mentionUsers}
            placeholder="Add a comment... use @ to mention someone"
            minRows={3}
            disabled={addingComment}
          />
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={!newComment.trim() || addingComment}
            sx={{ mt: 2 }}
          >
            {addingComment ? <CircularProgress size={20} /> : 'Add Comment'}
          </Button>
        </Box>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>

    {/* Activity Log Dialog */}
    <Dialog
      open={activityDialogOpen}
      onClose={() => { setActivityDialogOpen(false); setActivityMaximized(false); }}
      maxWidth={activityMaximized ? false : 'sm'}
      fullWidth
      fullScreen={activityMaximized}
      PaperProps={{
        sx: {
          borderRadius: activityMaximized ? 0 : 3,
          overflow: 'hidden',
          ...(activityMaximized ? {} : { maxHeight: '80vh' }),
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <HistoryIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box flex={1}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
            Activity Log
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {ticket.title}
          </Typography>
        </Box>
        <Chip
          label={`${activities.length} event${activities.length !== 1 ? 's' : ''}`}
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, border: 'none' }}
        />
        <Tooltip title={activityMaximized ? 'Restore' : 'Maximize'}>
          <IconButton
            size="small"
            onClick={() => setActivityMaximized((v) => !v)}
            sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            {activityMaximized ? <MinimizeIcon fontSize="small" /> : <MaximizeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Close">
          <IconButton
            size="small"
            onClick={() => { setActivityDialogOpen(false); setActivityMaximized(false); }}
            sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
        }}
      >
        {activities.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} gap={2}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HistoryIcon sx={{ fontSize: 32, color: '#6366f1', opacity: 0.6 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">No activity recorded yet</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowY: 'auto', flex: 1, px: 3, py: 2 }}>
            {activities.map((activity, index) => {
                const isMentioned = activity.action === 'COMMENTED' && !!activity.newValue && !!user?.name && activity.newValue.toLowerCase().includes(`@${user.name.toLowerCase()}`);
                return (
              <Box key={activity.id} display="flex" gap={2}>
                {/* Left: avatar + connector */}
                <Box display="flex" flexDirection="column" alignItems="center" sx={{ minWidth: 40 }}>
                  <Avatar
                    sx={{
                      width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700,
                      bgcolor: getActivityColor(activity.action),
                      boxShadow: `0 0 0 3px ${getActivityColor(activity.action)}33`,
                    }}
                  >
                    {activity.user.name.charAt(0).toUpperCase()}
                  </Avatar>
                  {index < activities.length - 1 && (
                    <Box sx={{ width: 2, flex: 1, minHeight: 20, my: 0.5, background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.03))' : 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.03))', borderRadius: 1 }} />
                  )}
                </Box>
                {/* Right: content card */}
                <Box pb={index < activities.length - 1 ? 2 : 0} flex={1} sx={{ minWidth: 0 }}>
                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: isMentioned ? 'primary.main' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', bgcolor: isMentioned ? (theme) => theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)' } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{activity.user.name}</Typography>
                        <Chip
                          label={(() => {
                            if (activity.action === 'COMMENTED' && activity.newValue) {
                              const names = extractMentionedUsers(activity.newValue, mentionUsers).map((u) => `@${u.name}`);
                              if (names.length) return `mentioned ${names.join(', ')}`;
                            }
                            return activity.action.replaceAll('_', ' ');
                          })()}
                          size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${getActivityColor(activity.action)}22`, color: getActivityColor(activity.action), border: `1px solid ${getActivityColor(activity.action)}44` }}
                        />
                        {isMentioned && <Chip label="mentioned you" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'primary.main', color: '#fff' }} />}
                      </Box>
                      <Tooltip title={formatDateTime(activity.createdAt)}>
                        <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', ml: 1, cursor: 'default' }}>
                          {formatRelativeDuration(activity.createdAt)}
                        </Typography>
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {renderWithMentions(getActivityLabel(activity), mentionUsers)}
                    </Typography>
                    {activity.action === 'COMMENTED' && activity.newValue && (() => {
                      const mentioned = extractMentionedUsers(activity.newValue, mentionUsers);
                      if (!mentioned.length) return null;
                      return (
                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.75}>
                          {mentioned.map((u) => (
                            <Chip
                              key={u.id}
                              label={`@${u.name}`}
                              size="small"
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'primary.main', color: '#fff' }}
                            />
                          ))}
                        </Box>
                      );
                    })()}
                  </Paper>
                </Box>
              </Box>
                );
              })}
          </Box>
        )}
      </DialogContent>
    </Dialog>

    </>
  );
};

export default TicketDetailsDialog;