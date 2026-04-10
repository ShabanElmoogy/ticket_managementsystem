import React from 'react';
import {
  Box, Typography, Paper, Button, IconButton,
  Tooltip, CircularProgress, Avatar, Divider,
} from '@mui/material';
import { Send, Delete, ChatBubbleOutline } from '@mui/icons-material';
import MentionTextField, { renderWithMentions, type MentionUser } from '../../tickets/MentionTextField';
import { usersApi } from '../../admin/usersManagement/api/users';
import { useQuery } from '@tanstack/react-query';
import { useEpicComments } from '../hooks/useEpicComments';

interface Props { epicId: string; }

const EpicComments: React.FC<Props> = ({ epicId }) => {
  const {
    user, comments, isLoading, content, setContent,
    isPosting, isDeleting, handleSubmit, handleKeyDown, canDelete, deleteComment,
  } = useEpicComments(epicId);

  const { data: mentionUsers = [] } = useQuery({
    queryKey: ['users', 'tenant'],
    queryFn: async () => {
      const list = await usersApi.getTenantUsers().catch(() => usersApi.getUsers());
      return list.map((u): MentionUser => ({ id: u.id, name: u.name }));
    },
  });

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

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Box sx={{ mb: 1 }}>
          <MentionTextField
            value={content}
            onChange={setContent}
            onKeyDown={handleKeyDown}
            users={mentionUsers}
            placeholder="Add a comment… (Ctrl+Enter to submit)"
            minRows={2}
            maxRows={6}
          />
        </Box>
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained" size="small" endIcon={<Send fontSize="small" />}
            disabled={!content.trim() || isPosting}
            onClick={handleSubmit}
          >
            {isPosting ? 'Posting…' : 'Comment'}
          </Button>
        </Box>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={5}><CircularProgress size={24} /></Box>
      ) : comments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">No comments yet. Start the discussion!</Typography>
        </Paper>
      ) : (
        <Box sx={{ maxHeight: 440, overflowY: 'auto', pr: 0.5 }}>
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
                        {renderWithMentions(comment.content, mentionUsers)}
                      </Typography>
                    </Paper>
                  </Box>
                  {canDelete(comment.user.id) && (
                    <Tooltip title="Delete comment">
                      <IconButton
                        size="small" color="error"
                        disabled={isDeleting}
                        onClick={() => deleteComment(comment.id)}
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
