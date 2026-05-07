/**
 * useTicketDetail — React Query hook for the Ticket Detail screen.
 *
 * Fetches ticket, comments, attachments, activities, and watchers.
 * Manages activeTab state and exposes mutations for all ticket actions.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/api';
import { ticketsApi } from '@/src/features/tickets/api/tickets';
import { useAuthStore } from '@/src/stores/authStore';
import type { TicketStatus } from '@/src/services/api/types/ticket';
import type { DocumentPickerAsset } from 'expo-document-picker';

export type TicketDetailTab = 'overview' | 'comments' | 'attachments' | 'activity';

export function useTicketDetail(ticketId: string, enabled = true) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TicketDetailTab>('overview');

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: ticket, isLoading: ticketLoading, refetch: refetchTicket } = useQuery({
    queryKey: QUERY_KEYS.TICKETS.detail(ticketId),
    queryFn: () => ticketsApi.getTicket(ticketId),
    enabled: enabled && !!ticketId,
    staleTime: 30_000,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: QUERY_KEYS.TICKETS.comments(ticketId),
    queryFn: () => ticketsApi.getComments(ticketId),
    enabled: enabled && !!ticketId,
  });

  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: QUERY_KEYS.TICKETS.attachments(ticketId),
    queryFn: () => ticketsApi.getAttachments(ticketId),
    enabled: enabled && !!ticketId,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: QUERY_KEYS.TICKETS.activities(ticketId),
    queryFn: () => ticketsApi.getActivities(ticketId),
    enabled: enabled && !!ticketId,
  });

  const { data: watchers = [] } = useQuery({
    queryKey: QUERY_KEYS.TICKETS.watchers(ticketId),
    queryFn: () => ticketsApi.getWatchers(ticketId),
    enabled: enabled && !!ticketId,
  });

  const isWatching = watchers.some((w) => w.id === currentUser?.id);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const toggleWatchMutation = useMutation({
    mutationFn: () => ticketsApi.watchTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.watchers(ticketId) });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => ticketsApi.addComment(ticketId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.comments(ticketId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.detail(ticketId) });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => ticketsApi.deleteComment(ticketId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.comments(ticketId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.detail(ticketId) });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (files: DocumentPickerAsset[]) => {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType ?? 'application/octet-stream',
        } as any);
      }
      return ticketsApi.uploadAttachment(ticketId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.attachments(ticketId) });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => ticketsApi.deleteAttachment(ticketId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.attachments(ticketId) });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: TicketStatus) => ticketsApi.updateTicket(ticketId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.all });
    },
  });

  const refetch = useCallback(() => {
    refetchTicket();
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.comments(ticketId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.attachments(ticketId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.activities(ticketId) });
  }, [refetchTicket, queryClient, ticketId]);

  return {
    ticket,
    comments,
    attachments,
    activities,
    watchers,
    isLoading: ticketLoading,
    commentsLoading,
    attachmentsLoading,
    activitiesLoading,
    activeTab,
    setActiveTab,
    isWatching,
    toggleWatch: () => toggleWatchMutation.mutate(),
    addComment: (content: string) => addCommentMutation.mutateAsync(content),
    deleteComment: (commentId: string) => deleteCommentMutation.mutate(commentId),
    uploadAttachment: (files: DocumentPickerAsset[]) => uploadAttachmentMutation.mutateAsync(files),
    deleteAttachment: (attachmentId: string) => deleteAttachmentMutation.mutate(attachmentId),
    updateStatus: (status: TicketStatus) => updateStatusMutation.mutate(status),
    isAddingComment: addCommentMutation.isPending,
    isUploadingAttachment: uploadAttachmentMutation.isPending,
    refetch,
    currentUser,
  };
}
