import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketTemplatesApi } from '../api/templates';
import { ticketTemplatesKeys } from '../api/queryKeys';
import type { TicketTemplate } from '../../../../services/api/types';
import type { TicketTemplatePayload } from '../types/types';

const emptyForm = (): TicketTemplatePayload => ({
  name: '', description: '', priority: 'MEDIUM', estimatedHours: null,
});

export function useTicketTemplates() {
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editing, setEditing]           = useState<TicketTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TicketTemplate | null>(null);
  const [snack, setSnack]               = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ticketTemplatesKeys.all,
    queryFn: () => ticketTemplatesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: TicketTemplatePayload) => ticketTemplatesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ticketTemplatesKeys.all }); setSnack({ msg: 'Template created', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to create template', severity: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TicketTemplatePayload> }) => ticketTemplatesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ticketTemplatesKeys.all }); setSnack({ msg: 'Template updated', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to update template', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketTemplatesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ticketTemplatesKeys.all }); setSnack({ msg: 'Template deleted', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to delete template', severity: 'error' }),
  });

  const openCreate = () => { setEditing(null); setDialogOpen(true); };

  const openEdit = (id: string) => {
    const t = templates.find((x) => x.id === id) ?? null;
    setEditing(t);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: TicketTemplatePayload) => {
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data });
    else await createMutation.mutateAsync(data);
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  return {
    templates, isLoading,
    dialogOpen, editing, deleteTarget, snack,
    saving: createMutation.isPending || updateMutation.isPending,
    deleting: deleteMutation.isPending,
    openCreate, openEdit, handleSubmit, handleDelete,
    setDialogOpen, setDeleteTarget, setSnack,
    emptyForm,
  };
}
