import React, { useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, IconButton,
  Tooltip, CircularProgress, Avatar, Divider,
} from '@mui/material';
import { Send, Delete, ChatBubbleOutline } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { epicsApi } from '../api/epics';
import { useAuthStore } from '../../../stores/authStore';

interface Props { epicId: string; }

const EpicComments: React.FC<Props> = ({ epicId }) => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['epics', epicId, 'comments'],
    queryFn: () => epicsApi.listComments(epicId),
    enabled: !!epicId,
  });

  const addMutation = useMutation({
    mutationFn: (text: string) => epicsApi.addComment(epicId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epics', epicId, 'comments'] });
      setContent('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => epicsApi.deleteComment(epicId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epics', epicId, 'comments'] }),
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    addMutation.mutate(content.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <ChatBubbleOutline color="action" />
        <Typography variant="h6" fontWeight={700}>
          Discussion
          {comments.length > 0 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({comments.length})
            </Typography>
          )}
        </Typography>
      </Box>

      {/* Comment input */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <TextField
          fullWidth multiline minRows={2} maxRows={6}
          placeholder="Add a comment… (Ctrl+Enter to submit)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          sx={{ mb: 1 }}
        />
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained" size="small" endIcon={<Send fontSize="small" />}
            disabled={!content.trim() || addMutation.isPending}
            onClick={handleSubmit}
          >
            {addMutation.isPending ? 'Posting…' : 'Comment'}
          </Button>
        </Box>
      </Paper>

      {/* Comments list */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
      ) : comments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">No comments yet. Start the discussion!</Typography>
        </Paper>
      ) : (
        <Box>
          {comments.map((comment, idx) => {
            const isOwn = comment.user.id === user?.id;
            const initials = comment.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <Box key={comment.id}>
                <Box display="flex" gap={1.5} alignItems="flex-start">
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main', flexShrink: 0 }}>
                    {initials}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="subtitle2" fontWeight={600}>{comment.user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: isOwn ? 'primary.50' : 'background.paper' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {comment.content}
                      </Typography>
                    </Paper>
                  </Box>
                  {(isOwn || user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                    <Tooltip title="Delete comment">
                      <IconButton
                        size="small" color="error"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(comment.id)}
                        sx={{ mt: 0.5 }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {idx < comments.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default EpicComments;
