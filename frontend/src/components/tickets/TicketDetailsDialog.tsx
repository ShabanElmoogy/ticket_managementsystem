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
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { ticketsApi, type Ticket, type Comment } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(3);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);

  useEffect(() => {
    if (ticket && open) {
      fetchTicketDetails();
      setVisibleCommentsCount(3); // Reset visible comments when dialog opens
    }
  }, [ticket, open]);

  const fetchTicketDetails = async () => {
    if (!ticket || !token) return;

    setLoading(true);
    try {
      const data = await ticketsApi.getTicket(ticket.id);
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket || !token) return;

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

  const handleLoadMoreComments = () => {
    setLoadingMoreComments(true);
    setTimeout(() => {
      setVisibleCommentsCount(prev => prev + 3);
      setLoadingMoreComments(false);
    }, 500); // Small delay to show loading state
  };

  if (!ticket) return null;

  const canUpdateStatus = user?.role === 'ADMIN' || ticket.assignedTo?.id === user?.id;

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{ticket.title}</DialogTitle>
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
        
        {canUpdateStatus && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Update Status
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((status) => (
                <Button
                  key={status}
                  variant={ticket.status === status ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => onUpdateStatus(ticket.id, status)}
                  disabled={ticket.status === status}
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </Box>
          </Box>
        )}
        
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
                  <Typography variant="subtitle2">
                    {comment.user.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(comment.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {comment.content}
                </Typography>
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
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={!newComment.trim() || addingComment}
          >
            {addingComment ? <CircularProgress size={20} /> : 'Add Comment'}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketDetailsDialog;