import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { epicsApi } from '../api/epics';
import { useAuthStore } from '../../../stores/authStore';

export const useEpicComments = (epicId: string) => {
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

  const canDelete = (commentUserId: string) =>
    commentUserId === user?.id || user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';

  return {
    user,
    comments,
    isLoading,
    content,
    setContent,
    isPosting: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    handleSubmit,
    handleKeyDown,
    canDelete,
    deleteComment: (commentId: string) => deleteMutation.mutate(commentId),
  };
};
