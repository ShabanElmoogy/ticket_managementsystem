import React from 'react';
import {
  Box, Typography, Paper, Button, Chip, Divider, Tooltip,
} from '@mui/material';
import {
  Edit, Apps, Person, CalendarToday, AccountTree,
  AccessTime, Update, Lock, Label, Add, Visibility, VisibilityOff, PictureAsPdf,
} from '@mui/icons-material';
import { exportEpicPdf } from '../utils/exportEpicPdf';
import type { Epic } from '../../../services/api/types';
import EpicStatusChip from '../components/EpicStatusChip';
import EpicPriorityChip from '../components/EpicPriorityChip';
import BlockerPickerMenu from './BlockerPickerMenu';
import { formatDate, formatDateTime } from '../../../utils/dateUtils';
import type { EpicFeature } from './types';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { epicsApi } from '../api/epics';
import { useUser } from '../../../stores/authStore';

interface Props {
  epic: Epic & {
    blockedBy?: { id: string; title: string; status: string }[];
    ownerName?: string | null;
    applicationName?: string | null;
    customerName?: string | null;
    featureCount: number;
    stepsTotal: number;
    stepsDone: number;
  };
  progress: number;
  overdue: boolean;
  isAdmin: boolean;
  orderedFeatures: EpicFeature[];
  blockerMenuAnchor: HTMLElement | null;
  onEditOpen: () => void;
  onAddBlocker: (e: React.MouseEvent<HTMLElement>) => void;
  onRemoveBlocker: (blockerId: string) => void;
  onBlockerMenuClose: () => void;
  onBlockerAdd: (blockerId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  UNDER_REVIEW: '#9e9e9e', PLANNED: '#29b6f6', IN_PROGRESS: '#1976d2',
  SHIPPED: '#2e7d32', DECLINED: '#d32f2f',
};
const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: 'Under Review', PLANNED: 'Planned', IN_PROGRESS: 'In Progress',
  SHIPPED: 'Shipped', DECLINED: 'Declined',
};

const EpicHeader: React.FC<Props> = ({
  epic, progress, overdue, isAdmin, orderedFeatures,
  blockerMenuAnchor, onEditOpen, onAddBlocker, onRemoveBlocker, onBlockerMenuClose, onBlockerAdd,
}) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useUser();

  const { data: watchers = [] } = useQuery({
    queryKey: ['epics', epic.id, 'watchers'],
    queryFn: () => epicsApi.getWatchers(epic.id),
    staleTime: 30_000,
  });

  const isWatching = watchers.some((w) => w.id === currentUser?.id);

  const watchMutation = useMutation({
    mutationFn: () => isWatching ? epicsApi.unwatch(epic.id) : epicsApi.watch(epic.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epics', epic.id, 'watchers'] }),
  });

  const counts = orderedFeatures.reduce<Record<string, number>>((acc, f) => {
    acc[f.status] = (acc[f.status] ?? 0) + 1;
    return acc;
  }, {});
  const segments = Object.entries(counts);
  const total = orderedFeatures.length;

  return (
    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
      {/* Title row */}
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
        {isAdmin && (
          <Button startIcon={<Edit />} variant="outlined" size="small" onClick={onEditOpen}>Edit</Button>
        )}
        {isAdmin && (
          <Button
            startIcon={<PictureAsPdf />}
            variant="outlined"
            size="small"
            color="error"
            onClick={() => exportEpicPdf(epic, orderedFeatures)}
          >
            Export PDF
          </Button>
        )}
        <Tooltip title={isWatching ? `Watching · ${watchers.length} watcher${watchers.length !== 1 ? 's' : ''}` : `Watch · ${watchers.length} watcher${watchers.length !== 1 ? 's' : ''}`}>
          <Button
            startIcon={isWatching ? <Visibility /> : <VisibilityOff />}
            variant={isWatching ? 'contained' : 'outlined'}
            size="small"
            color={isWatching ? 'primary' : 'inherit'}
            onClick={() => watchMutation.mutate()}
            disabled={watchMutation.isPending}
          >
            {isWatching ? 'Watching' : 'Watch'}
            {watchers.length > 0 && (
              <Box component="span" sx={{ ml: 0.5, opacity: 0.75, fontSize: '0.75rem' }}>
                {watchers.length}
              </Box>
            )}
          </Button>
        </Tooltip>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Stats row */}
      <Box display="flex" gap={3} flexWrap="wrap" alignItems="center" mb={2}>
        {[
          { value: epic.featureCount, label: 'Features' },
          { value: epic.stepsTotal,   label: 'Total Steps' },
          { value: epic.stepsDone,    label: 'Steps Done' },
          { value: `${progress}%`,   label: 'Complete', color: progress === 100 ? 'success.main' : undefined },
        ].map(({ value, label, color }) => (
          <Box key={label} textAlign="center">
            <Typography variant="h6" fontWeight={700} color={color}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title={formatDateTime(epic.createdAt)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
              <AccessTime sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Box>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', lineHeight: 1, display: 'block' }}>Created</Typography>
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.72rem', lineHeight: 1.2 }}>{formatDate(epic.createdAt)}</Typography>
              </Box>
            </Box>
          </Tooltip>
          <Tooltip title={formatDateTime(epic.updatedAt)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
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
      {total > 0 && (
        <Box>
          <Box display="flex" height={10} borderRadius={1} overflow="hidden" mb={1}>
            {segments.map(([status, count]) => (
              <Tooltip key={status} title={`${STATUS_LABELS[status] ?? status}: ${count}`}>
                <Box sx={{ width: `${(count / total) * 100}%`, bgcolor: STATUS_COLORS[status] ?? 'grey.400', transition: 'width 0.3s' }} />
              </Tooltip>
            ))}
          </Box>
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
      )}

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
          <Button size="small" startIcon={<Add />} onClick={onAddBlocker}>Add Blocker</Button>
        )}
      </Box>
      {(epic.blockedBy?.length ?? 0) === 0 ? (
        <Typography variant="body2" color="text.secondary">No blockers — this epic can proceed freely.</Typography>
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
                onDelete={isAdmin ? () => onRemoveBlocker(b.id) : undefined}
                onClick={() => navigate(`/epics/${b.id}`)}
                sx={{ cursor: 'pointer' }}
              />
            );
          })}
        </Box>
      )}
      <BlockerPickerMenu
        anchor={blockerMenuAnchor}
        epicId={epic.id}
        blockedBy={epic.blockedBy ?? []}
        onClose={onBlockerMenuClose}
        onAdd={onBlockerAdd}
      />
    </Paper>
  );
};

export default EpicHeader;
