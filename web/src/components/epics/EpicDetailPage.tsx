import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Chip,
  CircularProgress, Alert, Snackbar, Divider, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Menu, Tabs, Tab,
} from '@mui/material';
import {
  ArrowBack, Add, Edit, OpenInNew, LinkOff, Apps, Person,
  CalendarToday, AccountTree, Lightbulb, DragIndicator,
  InfoOutlined, FlipCameraAndroid, ThumbUp, EditNote,
  AccessTime, Update, Lock, Block, Label,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { epicsApi } from './api/epics';
import { featuresApi } from '../features/api/features';
import EpicStatusChip from './components/EpicStatusChip';
import EpicPriorityChip from './components/EpicPriorityChip';
import EpicFormDialog from './components/EpicFormDialog';
import EpicComments from './components/EpicComments';
import EpicActivity from './components/EpicActivity';
import FeatureStatusChip from '../features/components/FeatureStatusChip';
import FeatureFormDialog from '../features/components/FeatureFormDialog';
import type { UpdateEpicData, CreateFeatureData, UpdateFeatureData, FeatureRequest } from '../../services/api/types';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { useIsAdmin } from '../../stores/authStore';

type EpicFeature = {
  id: string;
  title: string;
  description?: string | null;
  status: FeatureRequest['status'];
  epicOrder: number;
  createdAt: string;
  applicationId?: string | null;
  customerId?: string | null;
  applicationName?: string | null;
  customerName?: string | null;
  submittedByName?: string | null;
  voteCount?: number;
};

// ── Sortable Feature Card ─────────────────────────────────────────────────────
const SortableFeatureCard: React.FC<{
  feature: EpicFeature;
  isAdmin: boolean;
  isFlipped: boolean;
  onFlip: (id: string | null) => void;
  onNavigate: (id: string) => void;
  onUnlink: (id: string) => void;
  onEdit: (feature: EpicFeature) => void;
  onStatusChange: (id: string, status: FeatureRequest['status']) => void;
  epicId: string;
}> = ({ feature, isAdmin, isFlipped, onFlip, onNavigate, onUnlink, onEdit, onStatusChange }) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const STATUSES: { value: FeatureRequest['status']; label: string; color: string }[] = [
    { value: 'UNDER_REVIEW', label: 'Under Review', color: '#9e9e9e' },
    { value: 'PLANNED',      label: 'Planned',      color: '#29b6f6' },
    { value: 'IN_PROGRESS',  label: 'In Progress',  color: '#1976d2' },
    { value: 'SHIPPED',      label: 'Shipped',      color: '#2e7d32' },
    { value: 'DECLINED',     label: 'Declined',     color: '#d32f2f' },
  ];
  const current = STATUSES.find((s) => s.value === feature.status)!;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: feature.id,
    disabled: !isAdmin,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 12,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <Box sx={{ perspective: '1000px', height: 72 }}>
        <Box sx={{
          position: 'relative', height: '100%',
          transformStyle: 'preserve-3d',
          transition: isDragging ? 'none' : 'transform 0.45s ease',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* FRONT */}
          <Paper sx={{
            position: 'absolute', inset: 0, p: 2, borderRadius: 2,
            border: '1px solid',
            borderColor: isDragging ? 'primary.main' : 'divider',
            boxShadow: isDragging ? 4 : 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main' },
          }}
            onClick={() => onNavigate(feature.id)}
          >
            <Box display="flex" alignItems="center" gap={1.5} height="100%">
              {isAdmin && (
                <Box
                  {...attributes}
                  {...listeners}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ color: 'text.disabled', cursor: 'grab', display: 'flex', touchAction: 'none' }}
                >
                  <DragIndicator fontSize="small" />
                </Box>
              )}
              <Lightbulb color="warning" fontSize="small" />
              <Box flex={1} minWidth={0}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }} noWrap>{feature.title}</Typography>
                  {isAdmin ? (
                    <>
                      <Chip
                        label={current.label}
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
                        sx={{ fontWeight: 600, bgcolor: current.color, color: '#fff', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
                      />
                      <Menu
                        anchorEl={menuAnchor}
                        open={!!menuAnchor}
                        onClose={() => setMenuAnchor(null)}
                        onClick={(e) => e.stopPropagation()}
                        disableScrollLock
                      >
                        {STATUSES.map((s) => (
                          <MenuItem
                            key={s.value}
                            selected={s.value === feature.status}
                            onClick={() => { onStatusChange(feature.id, s.value); setMenuAnchor(null); }}
                          >
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, mr: 1, flexShrink: 0 }} />
                            {s.label}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  ) : (
                    <FeatureStatusChip status={feature.status} />
                  )}
                </Box>
                {feature.description && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {feature.description}
                  </Typography>
                )}
              </Box>
              <Box display="flex" gap={0.5} onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Details">
                  <IconButton size="small" onClick={() => onFlip(isFlipped ? null : feature.id)}>
                    <InfoOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Open feature">
                  <IconButton size="small" onClick={() => onNavigate(feature.id)}>
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isAdmin && (
                  <Tooltip title="Edit feature">
                    <IconButton size="small" onClick={() => onEdit(feature)}>
                      <EditNote fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {isAdmin && (
                  <Tooltip title="Unlink from epic">
                    <IconButton size="small" color="error" onClick={() => onUnlink(feature.id)}>
                      <LinkOff fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Paper>

          {/* BACK */}
          <Paper sx={{
            position: 'absolute', inset: 0, p: 2, borderRadius: 2,
            border: '1px solid', borderColor: 'primary.main',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            bgcolor: 'primary.50',
            overflow: 'hidden',
          }}>
            <Box display="flex" alignItems="center" gap={1.5} height="100%">
              <Box flex={1} minWidth={0} display="flex" gap={2} alignItems="center" flexWrap="wrap">
                {feature.applicationName && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Apps sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" noWrap>{feature.applicationName}</Typography>
                  </Box>
                )}
                {feature.customerName && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" noWrap>{feature.customerName}</Typography>
                  </Box>
                )}
                {feature.submittedByName && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" noWrap>By: {feature.submittedByName}</Typography>
                  </Box>
                )}
                {feature.voteCount !== undefined && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <ThumbUp sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">{feature.voteCount} votes</Typography>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatDate(feature.createdAt)}
                </Typography>
              </Box>
              <Tooltip title="Flip back">
                <IconButton size="small" onClick={() => onFlip(null)}>
                  <FlipCameraAndroid fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

// ── Blocker Picker Menu ───────────────────────────────────────────────────────
const BlockerPickerMenu: React.FC<{
  anchor: HTMLElement | null;
  epicId: string;
  blockedBy: { id: string; title: string; status: string }[];
  onClose: () => void;
  onAdd: (blockerId: string) => void;
}> = ({ anchor, epicId, blockedBy, onClose, onAdd }) => {
  const { data: allEpics = [] } = useQuery({
    queryKey: ['epics'],
    queryFn: () => epicsApi.list(),
    enabled: !!anchor,
  });
  const available = allEpics.filter((e) => e.id !== epicId && !blockedBy.some((b) => b.id === e.id));
  return (
    <Menu anchorEl={anchor} open={!!anchor} onClose={onClose} disableScrollLock>
      <MenuItem disabled sx={{ fontSize: '0.75rem', opacity: 0.6 }}>Select an epic that blocks this one</MenuItem>
      {available.length === 0
        ? <MenuItem disabled>No other epics available</MenuItem>
        : available.map((e) => (
          <MenuItem key={e.id} onClick={() => { onAdd(e.id); onClose(); }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1, flexShrink: 0 }} />
            {e.title}
          </MenuItem>
        ))}
    </Menu>
  );
};

// ── Link Feature Dialog ───────────────────────────────────────────────────────
interface LinkDialogProps {
  open: boolean;
  epicId: string;
  linkedIds: string[];
  onClose: () => void;
  onLinked: (suggestedStatus: 'ACTIVE' | null) => void;
}

const LinkFeatureDialog: React.FC<LinkDialogProps> = ({ open, epicId, linkedIds, onClose, onLinked }) => {
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: allFeatures = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => featuresApi.list(),
    enabled: open,
  });

  const available = allFeatures.filter((f) => !linkedIds.includes(f.id) && !f.epicId);

  const handleLink = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const result = await epicsApi.linkFeature(epicId, selectedId);
      onLinked(result.suggestedStatus);
      onClose();
      setSelectedId('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Link Feature Request</DialogTitle>
      <DialogContent>
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>Feature Request</InputLabel>
          <Select value={selectedId} label="Feature Request" onChange={(e) => setSelectedId(e.target.value)}>
            <MenuItem value=""><em>Select a feature…</em></MenuItem>
            {available.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.title} {f.applicationName ? `· ${f.applicationName}` : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {available.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No unlinked feature requests available.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleLink} disabled={saving || !selectedId}>
          {saving ? 'Linking…' : 'Link Feature'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const EpicDetailPage: React.FC = () => {
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
  const [suggestCompleted, setSuggestCompleted] = useState(false);

  // @dnd-kit PointerSensor with 8px activation distance to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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
  }, [epic?.features]);  // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['epics', id] });
    qc.invalidateQueries({ queryKey: ['epics'] });
    qc.invalidateQueries({ queryKey: ['features'] });
  };

  const reorderMutation = useMutation({
    mutationFn: (reordered: EpicFeature[]) =>
      epicsApi.reorderFeatures(id!, reordered.map((f, i) => ({ id: f.id, order: i }))),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epics', id] }),
    onError: (err: any) =>
      setSnack({ msg: `Failed to save order: ${err?.message ?? 'Unknown error'}`, severity: 'error' }),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedFeatures.findIndex((f) => f.id === active.id);
    const newIndex = orderedFeatures.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(orderedFeatures, oldIndex, newIndex);
    setOrderedFeatures(reordered);
    reorderMutation.mutate(reordered);
  };

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEpicData) => epicsApi.update(id!, data),
    onSuccess: () => { invalidate(); setSnack({ msg: 'Epic updated', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to update', severity: 'error' }),
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

  const handleNewFeature = async (data: CreateFeatureData | UpdateFeatureData) => {
    const created = await featuresApi.create(data as CreateFeatureData);
    const result = await epicsApi.linkFeature(id!, created.id);
    invalidate();
    setSnack({ msg: 'Feature created and linked!', severity: 'success' });
    if (result.suggestedStatus === 'ACTIVE') setSuggestActive(true);
  };

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
      if (data.status === undefined) {
        invalidate();
        setSnack({ msg: 'Feature updated', severity: 'success' });
      } else if (res?.allShipped) {
        setSuggestCompleted(true);
      }
    },
    onError: () => {
      invalidate();
      setSnack({ msg: 'Failed to update feature', severity: 'error' });
    },
  });

  const handleStatusChange = (fid: string, status: FeatureRequest['status']) => {
    setOrderedFeatures((prev) => prev.map((f) => f.id === fid ? { ...f, status } : f));
    editFeatureMutation.mutate({ fid, data: { status } });
  };

  const handleEditFeature = async (data: CreateFeatureData | UpdateFeatureData) => {
    if (!editingFeature) return;
    await editFeatureMutation.mutateAsync({ fid: editingFeature.id, data: data as UpdateFeatureData });
    setEditingFeature(null);
  };

  if (isLoading) return <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>;
  if (!epic) return <Box p={4}><Alert severity="error">Epic not found</Alert></Box>;

  const progress = epic.stepsTotal ? Math.round((epic.stepsDone / epic.stepsTotal) * 100) : 0;
  const overdue = epic.targetDate && new Date(epic.targetDate) < new Date() && epic.status !== 'COMPLETED';
  const linkedIds = orderedFeatures.map((f) => f.id);

  const overduedays = (() => {
    if (!epic.targetDate || !overdue) return 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(epic.targetDate); target.setHours(0, 0, 0, 0);
    return Math.round((today.getTime() - target.getTime()) / 86400000);
  })();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/epics')} sx={{ mb: 2 }}>
        Back to Epics
      </Button>

      {overdue && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          This epic is <strong>{overduedays} day{overduedays !== 1 ? 's' : ''} overdue</strong> — target date was {formatDate(epic.targetDate!)}. Update the target date or mark it completed.
        </Alert>
      )}

      {/* Epic Header */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
              <AccountTree color="primary" />
              <Typography variant="h5" fontWeight={700}>{epic.title}</Typography>
              <EpicPriorityChip priority={epic.priority} />
              <EpicStatusChip status={epic.status} />
            </Box>
            {epic.description && (
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {epic.description}
              </Typography>
            )}
            <Box display="flex" gap={1} flexWrap="wrap">
              {epic.applicationName && <Chip icon={<Apps fontSize="small" />} label={epic.applicationName} size="small" variant="outlined" />}
              {epic.customerName && <Chip icon={<Person fontSize="small" />} label={epic.customerName} size="small" variant="outlined" color="secondary" />}
              {epic.ownerName && <Chip icon={<Person fontSize="small" />} label={`Owner: ${epic.ownerName}`} size="small" variant="outlined" color="primary" />}
              {epic.targetDate && (
                <Chip icon={<CalendarToday fontSize="small" />} label={formatDate(epic.targetDate)}
                  size="small" variant="outlined" color={overdue ? 'error' : 'default'} />
              )}
              {(epic.tags ?? []).map((t) => (
                <Chip key={t} icon={<Label fontSize="small" />} label={t} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {isAdmin && (
              <Button startIcon={<Edit />} variant="outlined" size="small" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            )}
          </Box>
        </Box>


        <Divider sx={{ my: 2 }} />
        <Box display="flex" gap={3} flexWrap="wrap" alignItems="center" mb={2}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={700}>{epic.featureCount}</Typography>
            <Typography variant="caption" color="text.secondary">Features</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={700}>{epic.stepsTotal}</Typography>
            <Typography variant="caption" color="text.secondary">Total Steps</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={700}>{epic.stepsDone}</Typography>
            <Typography variant="caption" color="text.secondary">Steps Done</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={700} color={progress === 100 ? 'success.main' : 'text.primary'}>{progress}%</Typography>
            <Typography variant="caption" color="text.secondary">Complete</Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title={formatDateTime(epic.createdAt)}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 1.5, py: 0.5, borderRadius: 2,
                bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider',
              }}>
                <AccessTime sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', lineHeight: 1, display: 'block' }}>Created</Typography>
                  <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.72rem', lineHeight: 1.2 }}>{formatDate(epic.createdAt)}</Typography>
                </Box>
              </Box>
            </Tooltip>
            <Tooltip title={formatDateTime(epic.updatedAt)}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 1.5, py: 0.5, borderRadius: 2,
                bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100',
              }}>
                <Update sx={{ fontSize: 13, color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.6rem', lineHeight: 1, display: 'block' }}>Updated</Typography>
                  <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ fontSize: '0.72rem', lineHeight: 1.2 }}>{formatDate(epic.updatedAt)}</Typography>
                </Box>
              </Box>
            </Tooltip>
          </Box>
        </Box>

        {/* Feature status breakdown */}
        {orderedFeatures.length > 0 && (() => {
          const STATUS_COLORS: Record<string, string> = {
            UNDER_REVIEW: '#9e9e9e',
            PLANNED:      '#29b6f6',
            IN_PROGRESS:  '#1976d2',
            SHIPPED:      '#2e7d32',
            DECLINED:     '#d32f2f',
          };
          const STATUS_LABELS: Record<string, string> = {
            UNDER_REVIEW: 'Under Review',
            PLANNED:      'Planned',
            IN_PROGRESS:  'In Progress',
            SHIPPED:      'Shipped',
            DECLINED:     'Declined',
          };
          const total = orderedFeatures.length;
          const counts = orderedFeatures.reduce<Record<string, number>>((acc, f) => {
            acc[f.status] = (acc[f.status] ?? 0) + 1;
            return acc;
          }, {});
          const segments = Object.entries(counts);
          return (
            <Box>
              {/* Stacked bar */}
              <Box display="flex" height={10} borderRadius={1} overflow="hidden" mb={1}>
                {segments.map(([status, count]) => (
                  <Tooltip key={status} title={`${STATUS_LABELS[status] ?? status}: ${count}`}>
                    <Box sx={{ width: `${(count / total) * 100}%`, bgcolor: STATUS_COLORS[status] ?? 'grey.400', transition: 'width 0.3s' }} />
                  </Tooltip>
                ))}
              </Box>
              {/* Legend */}
              <Box display="flex" gap={2} flexWrap="wrap">
                {segments.map(([status, count]) => (
                  <Box key={status} display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STATUS_COLORS[status] ?? 'grey.400', flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary">
                      {STATUS_LABELS[status] ?? status} <strong>{count}</strong>
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })()}

        <Divider sx={{ my: 2 }} />

        {/* Dependencies */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Lock sx={{ fontSize: 18, color: epic.blockedBy?.some((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED') ? 'error.main' : 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight={700}>Dependencies</Typography>
            {epic.blockedBy?.some((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED') && (
              <Chip label="Blocked" color="error" size="small" />
            )}
          </Box>
          {isAdmin && (
            <Button size="small" startIcon={<Add />} onClick={(e) => setBlockerMenuAnchor(e.currentTarget)}>
              Add Blocker
            </Button>
          )}
        </Box>
        {(epic.blockedBy?.length ?? 0) === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No blockers — this epic can proceed freely.
          </Typography>
        ) : (
          <Box display="flex" gap={1} flexWrap="wrap">
            {epic.blockedBy!.map((b) => {
              const resolved = b.status === 'COMPLETED' || b.status === 'CANCELLED';
              return (
                <Chip
                  key={b.id}
                  icon={<Lock fontSize="small" />}
                  label={`${b.title} · ${b.status.replace('_', ' ')}`}
                  size="small"
                  color={resolved ? 'success' : 'error'}
                  variant={resolved ? 'outlined' : 'filled'}
                  onDelete={isAdmin ? () => blockerMutation.mutate({ action: 'remove', blockerId: b.id }) : undefined}
                  onClick={() => navigate(`/epics/${b.id}`)}
                  sx={{ cursor: 'pointer' }}
                />
              );
            })}
          </Box>
        )}
        <BlockerPickerMenu
          anchor={blockerMenuAnchor}
          epicId={id!}
          blockedBy={epic.blockedBy ?? []}
          onClose={() => setBlockerMenuAnchor(null)}
          onAdd={(blockerId) => blockerMutation.mutate({ action: 'add', blockerId })}
        />
      </Paper>

      {/* Two-column layout on large screens */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 3, alignItems: 'start' }}>

        {/* Left: Features Section */}
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700}>
          Feature Requests
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({orderedFeatures.length})
          </Typography>
        </Typography>
        {isAdmin && (
          <Box display="flex" gap={1}>
            <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => setNewFeatureOpen(true)}>
              New Feature
            </Button>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setLinkOpen(true)}>
              Link Existing
            </Button>
          </Box>
        )}
      </Box>

      {orderedFeatures.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Lightbulb sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">No features linked yet.</Typography>
          {isAdmin && (
            <Box display="flex" gap={1} mt={1} justifyContent="center">
              <Button startIcon={<Add />} onClick={() => setNewFeatureOpen(true)}>New Feature</Button>
              <Button startIcon={<Add />} onClick={() => setLinkOpen(true)}>Link Existing</Button>
            </Box>
          )}
        </Paper>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedFeatures.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {orderedFeatures.map((feature) => (
              <SortableFeatureCard
                key={feature.id}
                feature={feature}
                isAdmin={isAdmin}
                isFlipped={flippedId === feature.id}
                onFlip={setFlippedId}
                onNavigate={(fid) => navigate(`/features/${fid}`, { state: { from: `/epics/${id}` } })}
                onUnlink={(fid) => unlinkMutation.mutate(fid)}
                onEdit={(f) => setEditingFeature(f)}
                onStatusChange={handleStatusChange}
                epicId={id!}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
        </Box>

        {/* Right: Discussion + Activity */}
        <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
          <Tabs value={sidebarTab} onChange={(_, v) => setSidebarTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Comments" />
            <Tab label="Activity" />
          </Tabs>
          {sidebarTab === 0 ? <EpicComments epicId={id!} /> : <EpicActivity epicId={id!} />}
        </Box>

      </Box>{/* end two-column grid */}

      <EpicFormDialog
        open={editOpen}
        editing={epic}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => { await updateMutation.mutateAsync(data as UpdateEpicData); setEditOpen(false); }}
      />

<FeatureFormDialog
        open={newFeatureOpen}
        editing={null}
        isAdmin={isAdmin}
        onClose={() => setNewFeatureOpen(false)}
        onSubmit={handleNewFeature}
      />

      <FeatureFormDialog
        open={!!editingFeature}
        editing={editingFeature as FeatureRequest | null}
        isAdmin={isAdmin}
        onClose={() => setEditingFeature(null)}
        onSubmit={handleEditFeature}
      />

      <LinkFeatureDialog
        open={linkOpen}
        epicId={id!}
        linkedIds={linkedIds}
        onClose={() => setLinkOpen(false)}
        onLinked={(suggested) => { invalidate(); if (suggested === 'ACTIVE') setSuggestActive(true); }}
      />

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>

      {/* Suggest ACTIVE when first feature is linked */}
      <Dialog open={suggestActive} onClose={() => setSuggestActive(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set Epic to Active?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You just linked the first feature to this epic. Would you like to set its status to <strong>ACTIVE</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuggestActive(false)}>Keep as Draft</Button>
          <Button variant="contained" onClick={async () => {
            await updateMutation.mutateAsync({ status: 'ACTIVE' });
            setSuggestActive(false);
          }}>
            Set Active
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suggest COMPLETED when all features are shipped */}
      <Dialog open={suggestCompleted} onClose={() => setSuggestCompleted(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Mark Epic as Completed?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            All features have been shipped. Would you like to mark this epic as <strong>COMPLETED</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuggestCompleted(false)}>Not Yet</Button>
          <Button variant="contained" color="success" onClick={async () => {
            await updateMutation.mutateAsync({ status: 'COMPLETED' });
            setSuggestCompleted(false);
          }}>
            Mark Completed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EpicDetailPage;
