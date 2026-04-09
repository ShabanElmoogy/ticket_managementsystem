import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, LinearProgress,
  CircularProgress, Alert, Snackbar, Divider, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  ArrowBack, Add, Edit, OpenInNew, LinkOff, Apps, Person,
  CalendarToday, AccountTree, Lightbulb,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { epicsApi } from './api/epics';
import { featuresApi } from '../features/api/features';
import EpicStatusChip from './components/EpicStatusChip';
import EpicFormDialog from './components/EpicFormDialog';
import FeatureStatusChip from '../features/components/FeatureStatusChip';
import FeatureFormDialog from '../features/components/FeatureFormDialog';
import type { Epic, UpdateEpicData, CreateFeatureData, UpdateFeatureData } from '../../services/api/types';
import { useIsAdmin } from '../../stores/authStore';

// ── Link Feature Dialog ───────────────────────────────────────────────────────
interface LinkDialogProps {
  open: boolean;
  epicId: string;
  linkedIds: string[];
  onClose: () => void;
  onLinked: () => void;
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
      await epicsApi.linkFeature(epicId, selectedId);
      onLinked();
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
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const { data: epic, isLoading } = useQuery({
    queryKey: ['epics', id],
    queryFn: () => epicsApi.getOne(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['epics', id] });
    qc.invalidateQueries({ queryKey: ['epics'] });
    qc.invalidateQueries({ queryKey: ['features'] });
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

  // Fix #5: create feature directly from epic and auto-link
  const handleNewFeature = async (data: CreateFeatureData | UpdateFeatureData) => {
    const created = await featuresApi.create(data as CreateFeatureData);
    await epicsApi.linkFeature(id!, created.id);
    invalidate();
    setSnack({ msg: 'Feature created and linked!', severity: 'success' });
  };

  if (isLoading) return <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>;
  if (!epic) return <Box p={4}><Alert severity="error">Epic not found</Alert></Box>;

  const progress = epic.stepsTotal ? Math.round((epic.stepsDone / epic.stepsTotal) * 100) : 0;
  const overdue = epic.targetDate && new Date(epic.targetDate) < new Date() && epic.status !== 'COMPLETED';
  const linkedIds = (epic.features ?? []).map((f) => f.id);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/epics')} sx={{ mb: 2 }}>
        Back to Epics
      </Button>

      {/* Epic Header */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
              <AccountTree color="primary" />
              <Typography variant="h5" fontWeight={700}>{epic.title}</Typography>
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
                <Chip icon={<CalendarToday fontSize="small" />} label={new Date(epic.targetDate).toLocaleDateString()}
                  size="small" variant="outlined" color={overdue ? 'error' : 'default'} />
              )}
            </Box>
          </Box>

          {isAdmin && (
            <Button startIcon={<Edit />} variant="outlined" size="small" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          )}
        </Box>

        {/* Progress */}
        <Divider sx={{ my: 2 }} />
        <Box display="flex" gap={3} flexWrap="wrap" mb={epic.stepsTotal > 0 ? 1.5 : 0}>
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
        </Box>
        {epic.stepsTotal > 0 && (
          <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1, height: 8 }} color={progress === 100 ? 'success' : 'primary'} />
        )}
      </Paper>

      {/* Features Section */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700}>
          Feature Requests
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({(epic.features ?? []).length})
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

      {(epic.features ?? []).length === 0 ? (
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
        (epic.features ?? []).map((feature) => (
          <Paper
            key={feature.id}
            sx={{ mb: 1.5, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
              cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
            onClick={() => navigate(`/features/${feature.id}`, { state: { from: `/epics/${id}` } })}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Lightbulb color="warning" fontSize="small" />
              <Box flex={1} minWidth={0}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>{feature.title}</Typography>
                  <FeatureStatusChip status={feature.status} />
                </Box>
                {feature.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                    {feature.description}
                  </Typography>
                )}
              </Box>
              <Box display="flex" gap={0.5} onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Open feature">
                  <IconButton size="small" onClick={() => navigate(`/features/${feature.id}`, { state: { from: `/epics/${id}` } })}>
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isAdmin && (
                  <Tooltip title="Unlink from epic">
                    <IconButton size="small" color="error" onClick={() => unlinkMutation.mutate(feature.id)}>
                      <LinkOff fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Paper>
        ))
      )}

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

      <LinkFeatureDialog
        open={linkOpen}
        epicId={id!}
        linkedIds={linkedIds}
        onClose={() => setLinkOpen(false)}
        onLinked={invalidate}
      />

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EpicDetailPage;
