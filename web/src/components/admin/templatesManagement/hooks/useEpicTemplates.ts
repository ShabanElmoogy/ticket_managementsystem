import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { epicTemplatesApi, type EpicTemplate, type CreateTemplateData } from '../../../epics/api/epicTemplates';

export function useEpicTemplates() {
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editing, setEditing]           = useState<EpicTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EpicTemplate | null>(null);
  const [snack, setSnack]               = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['epic-templates'],
    queryFn: () => epicTemplatesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateData) => epicTemplatesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epic-templates'] });
      setSnack({ msg: 'Template created', severity: 'success' });
    },
    onError: () => setSnack({ msg: 'Failed to create template', severity: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplateData> }) =>
      epicTemplatesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epic-templates'] });
      setSnack({ msg: 'Template updated', severity: 'success' });
    },
    onError: () => setSnack({ msg: 'Failed to update template', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => epicTemplatesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epic-templates'] });
      setSnack({ msg: 'Template deleted', severity: 'success' });
    },
    onError: () => setSnack({ msg: 'Failed to delete template', severity: 'error' }),
  });

  const openCreate = () => { setEditing(null); setDialogOpen(true); };

  const openEdit = (id: string) => {
    const t = templates.find((x) => x.id === id) ?? null;
    setEditing(t);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateTemplateData) => {
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data });
    else await createMutation.mutateAsync(data);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  return {
    templates, isLoading,
    dialogOpen, editing, deleteTarget, snack,
    deleting: deleteMutation.isPending,
    openCreate, openEdit, handleSubmit, handleDelete,
    setDialogOpen, setDeleteTarget, setSnack,
  };
}
