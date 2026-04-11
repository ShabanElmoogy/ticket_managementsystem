import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { epicsApi } from '../api/epics';
import { featuresApi } from '../../features/api/features';
import type { UpdateEpicData, CreateFeatureData, UpdateFeatureData, FeatureRequest } from '../../../services/api/types';
import { useIsAdmin } from '../../../stores/authStore';
import type { EpicFeature } from '../detail/types';

export const useEpicDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAdmin = useIsAdmin();

  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [newFeatureOpen, setNewFeatureOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<EpicFeature | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [orderedFeatures, setOrderedFeatures] = useState<EpicFeature[]>([]);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [blockerMenuAnchor, setBlockerMenuAnchor] = useState<null | HTMLElement>(null);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [suggestActive, setSuggestActive] = useState(false);
  const [autoCloseData, setAutoCloseData] = useState<{ autoCloseEnabled: boolean; openTickets: number } | null>(null);

  const { data: epic, isLoading } = useQuery({
    queryKey: ['epics', id],
    queryFn: () => epicsApi.getOne(id!),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (!epic?.features) return;
    setOrderedFeatures(
      [...(epic.features as unknown as EpicFeature[])].sort((a, b) => (a.epicOrder ?? 0) - (b.epicOrder ?? 0))
    );
  }, [epic?.features]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['epics', id] });
    qc.invalidateQueries({ queryKey: ['epics'] });
    qc.invalidateQueries({ queryKey: ['features'] });
    qc.invalidateQueries({ queryKey: ['epics', id, 'activity'] });
  };

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEpicData) => epicsApi.update(id!, data),
    onSuccess: () => { invalidate(); setSnack({ msg: 'Epic updated', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to update', severity: 'error' }),
  });

  const reorderMutation = useMutation({
    mutationFn: (reordered: EpicFeature[]) =>
      epicsApi.reorderFeatures(id!, reordered.map((f, i) => ({ id: f.id, order: i }))),
    onSuccess: () => invalidate(),
    onError: (err: any) => setSnack({ msg: `Failed to save order: ${err?.message ?? 'Unknown error'}`, severity: 'error' }),
  });

  const unlinkMutation = useMutation({
    mutationFn: (featureId: string) => epicsApi.unlinkFeature(id!, featureId),
    onSuccess: () => { invalidate(); setSnack({ msg: 'Feature unlinked', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to unlink', severity: 'error' }),
  });

  const blockerMutation = useMutation({
    mutationFn: ({ action, blockerId }: { action: 'add' | 'remove'; blockerId: string }) =>
      action === 'add' ? epicsApi.addBlocker(id!, blockerId) : epicsApi.removeBlocker(id!, blockerId),
    onSuccess: () => invalidate(),
    onError: (err: any) => setSnack({ msg: err?.response?.data?.error ?? 'Failed to update blockers', severity: 'error' }),
  });

  const editFeatureMutation = useMutation({
    mutationFn: ({ fid, data }: { fid: string; data: UpdateFeatureData }) => featuresApi.update(fid, data),
    onMutate: async ({ fid, data }) => {
      if (data.status === undefined) return;
      await qc.cancelQueries({ queryKey: ['epics', id] });
      qc.setQueryData(['epics', id], (old: any) => {
        if (!old?.features) return old;
        return { ...old, features: old.features.map((f: any) => f.id === fid ? { ...f, status: data.status } : f) };
      });
    },
    onSuccess: (res: any, { data }) => {
      invalidate();
      if (data.status === undefined) {
        setSnack({ msg: 'Feature updated', severity: 'success' });
      } else if (res?.allShipped) {
        const autoCloseEnabled: boolean = res.autoCloseEnabled ?? true;
        const openTickets: number = res.openTickets ?? 0;
        if (autoCloseEnabled && openTickets === 0) {
          // Auto-close immediately — no dialog needed
          updateMutation.mutate({ status: 'COMPLETED' });
        } else {
          setAutoCloseData({ autoCloseEnabled, openTickets });
        }
      }
    },
    onError: () => { invalidate(); setSnack({ msg: 'Failed to update feature', severity: 'error' }); },
  });

  const handleNewFeature = async (data: CreateFeatureData | UpdateFeatureData) => {
    const created = await featuresApi.create(data as CreateFeatureData);
    const result = await epicsApi.linkFeature(id!, created.id);
    invalidate();
    setSnack({ msg: 'Feature created and linked!', severity: 'success' });
    if (result.suggestedStatus === 'ACTIVE') setSuggestActive(true);
  };

  const handleEditFeature = async (data: CreateFeatureData | UpdateFeatureData) => {
    if (!editingFeature) return;
    await editFeatureMutation.mutateAsync({ fid: editingFeature.id, data: data as UpdateFeatureData });
    setEditingFeature(null);
  };

  const handleStatusChange = (fid: string, status: FeatureRequest['status']) => {
    setOrderedFeatures((prev) => prev.map((f) => f.id === fid ? { ...f, status } : f));
    editFeatureMutation.mutate({ fid, data: { status } });
  };

  const handleReorder = (reordered: EpicFeature[]) => {
    setOrderedFeatures(reordered);
    reorderMutation.mutate(reordered);
  };

  const handleUpdate = async (data: UpdateEpicData) => {
    await updateMutation.mutateAsync(data);
  };

  return {
    id,
    navigate,
    isAdmin,
    epic,
    isLoading,
    orderedFeatures,
    flippedId, setFlippedId,
    blockerMenuAnchor, setBlockerMenuAnchor,
    sidebarTab, setSidebarTab,
    editOpen, setEditOpen,
    linkOpen, setLinkOpen,
    newFeatureOpen, setNewFeatureOpen,
    editingFeature, setEditingFeature,
    snack, setSnack,
    suggestActive, setSuggestActive,
    autoCloseData, setAutoCloseData,
    handleNewFeature,
    handleEditFeature,
    handleStatusChange,
    handleReorder,
    handleUpdate,
    onUnlink: (fid: string) => unlinkMutation.mutate(fid),
    onBlockerAdd: (blockerId: string) => blockerMutation.mutate({ action: 'add', blockerId }),
    onBlockerRemove: (blockerId: string) => blockerMutation.mutate({ action: 'remove', blockerId }),
    invalidate,
  };
};
