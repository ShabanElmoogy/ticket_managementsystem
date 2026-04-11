import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Divider, Tooltip, Collapse, IconButton,
} from '@mui/material';
import {
  Edit, Apps, Person, CalendarToday, AccountTree,
  AccessTime, Update, Lock, Label, Add, Visibility, VisibilityOff,
  PictureAsPdf, ExpandMore, ExpandLess, ArrowBack,
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
  onBack: () => void;
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
  blockerMenuAnchor, onEditOpen, onAddBlocker, onRemoveBlocker, onBlockerMenuClose, onBlockerAdd, onBack,
}) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useUser();
  const [descExpanded, setDescExpanded] = useState(false);

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
  const hasBlockers = (epic.blockedBy?.length ?? 0) > 0;
  const isBlocked = epic.blockedBy?.some((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
  const descLong = (epic.description?.length ?? 0) > 120;

  return (
    <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>

      {/* ── Row 1: title + actions ── */}
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <Tooltip title="Back to Epics">
          <IconButton size="small" onClick={onBack} sx={{ flexShrink: 0 }}>
            <ArrowBack fontSize="small" />
          </IconButton>
        </Tooltip>
        <AccountTree color="primary" fontSize="small" sx={{ flexShrink: 0 }} />
        <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} noWrap>{epic.title}</Typography>
          <EpicPriorityChip priority={epic.priority} />
          <EpicStatusChip status={epic.status} />
        </Box>

        {/* action buttons */}
        <Box display="flex" gap={0.75} ml="auto" flexShrink={0}>
          <Tooltip title={isWatching ? `Watching · ${watchers.length}` : `Watch · ${watchers.length}`}>
            <Button
              startIcon={isWatching ? <Visibility /> : <VisibilityOff />}
              variant={isWatching ? 'contained' : 'outlined'}
              size="small"
              color={isWatching ? 'primary' : 'inherit'}
              onClick={() => watchMutation.mutate()}
              disabled={watchMutation.isPending}
              sx={{ minWidth: 0 }}
            >
              {isWatching ? 'Watching' : 'Watch'}
              {watchers.length > 0 && (
                <Box component="span" sx={{ ml: 0.5, opacity: 0.7, fontSize: '0.72rem' }}>{watchers.length}</Box>
              )}
            </Button>
          </Tooltip>
          {isAdmin && (
            <>
              <Button startIcon={<Edit />} variant="outlined" size="small" onClick={onEditOpen}>Edit</Button>
              <Tooltip title="Export PDF">
                <Button
                  startIcon={<PictureAsPdf />}
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => exportEpicPdf(epic, orderedFeatures)}
                  sx={{ minWidth: 0 }}
                >
                  PDF
                </Button>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {/* ── Row 2: description (collapsible) ── */}
      {epic.description && (
        <Box mt={0.75}>
          <Collapse in={descExpanded} collapsedSize={40}>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
              {epic.description}
            </Typography>
          </Collapse>
          {descLong && (
            <Box
              component="span"
              onClick={() => setDescExpanded((v) => !v)}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, cursor: 'pointer', color: 'primary.main', fontSize: '0.75rem', mt: 0.25 }}
            >
              {descExpanded ? <><ExpandLess sx={{ fontSize: 14 }} />Show less</> : <><ExpandMore sx={{ fontSize: 14 }} />Show more</>}
            </Box>
          )}
        </Box>
      )}

      {/* ── Row 3: meta chips + timestamps ── */}
      <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap" mt={1}>
        {epic.applicationName && <Chip icon={<Apps sx={{ fontSize: '0.85rem !important' }} />} label={epic.applicationName} size="small" variant="outlined" />}
        {epic.customerName && <Chip icon={<Person sx={{ fontSize: '0.85rem !important' }} />} label={epic.customerName} size="small" variant="outlined" color="secondary" />}
        {epic.ownerName && <Chip icon={<Person sx={{ fontSize: '0.85rem !important' }} />} label={`Owner: ${epic.ownerName}`} size="small" variant="outlined" color="primary" />}
        {epic.targetDate && (
          <Chip icon={<CalendarToday sx={{ fontSize: '0.85rem !important' }} />} label={formatDate(epic.targetDate)}
            size="small" variant="outlined" color={overdue ? 'error' : 'default'} />
        )}
        {(epic.tags ?? []).map((t) => (
          <Chip key={t} icon={<Label sx={{ fontSize: '0.85rem !important' }} />} label={t} size="small" variant="outlined" />
        ))}

        {/* timestamps pushed right */}
        <Box display="flex" gap={0.75} ml="auto" flexShrink={0}>
          <Tooltip title={formatDateTime(epic.createdAt)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: 1.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
              <AccessTime sx={{ fontSize: 11, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>{formatDate(epic.createdAt)}</Typography>
            </Box>
          </Tooltip>
          <Tooltip title={formatDateTime(epic.updatedAt)}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: 1.5, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
              <Update sx={{ fontSize: 11, color: 'primary.main' }} />
              <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.68rem' }}>{formatDate(epic.updatedAt)}</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ my: 1.25 }} />

      {/* ── Row 4: stats + progress ── */}
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
        {[
          { value: epic.featureCount, label: 'Features' },
          { value: epic.stepsTotal,   label: 'Steps' },
          { value: epic.stepsDone,    label: 'Done' },
          { value: `${progress}%`,   label: 'Complete', color: progress === 100 ? 'success.main' : 'text.primary' },
        ].map(({ value, label, color }) => (
          <Box key={label} textAlign="center" sx={{ minWidth: 40 }}>
            <Typography variant="subtitle2" fontWeight={700} color={color ?? 'text.primary'} sx={{ lineHeight: 1.2 }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
          </Box>
        ))}

        {/* progress bar */}
        {total > 0 && (
          <Box flex={1} minWidth={80}>
            <Box display="flex" height={6} borderRadius={1} overflow="hidden">
              {segments.map(([status, count]) => (
                <Tooltip key={status} title={`${STATUS_LABELS[status] ?? status}: ${count}`}>
                  <Box sx={{ width: `${(count / total) * 100}%`, bgcolor: STATUS_COLORS[status] ?? 'grey.400', transition: 'width 0.3s' }} />
                </Tooltip>
              ))}
            </Box>
            <Box display="flex" gap={1.5} flexWrap="wrap" mt={0.5}>
              {segments.map(([status, count]) => (
                <Box key={status} display="flex" alignItems="center" gap={0.4}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS[status] ?? 'grey.400', flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {STATUS_LABELS[status] ?? status} <strong>{count}</strong>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 1.25 }} />

      {/* ── Row 5: dependencies ── */}
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        <Lock sx={{ fontSize: 15, color: isBlocked ? 'error.main' : 'text.disabled', flexShrink: 0 }} />
        <Typography variant="caption" fontWeight={600} color="text.secondary">Blockers</Typography>
        {isBlocked && <Chip label="Blocked" color="error" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}

        {!hasBlockers && (
          <Typography variant="caption" color="text.disabled">None</Typography>
        )}
        {epic.blockedBy?.map((b) => {
          const resolved = b.status === 'COMPLETED' || b.status === 'CANCELLED';
          return (
            <Chip
              key={b.id}
              icon={<Lock sx={{ fontSize: '0.8rem !important' }} />}
              label={`${b.title} · ${b.status.replace('_', ' ')}`}
              size="small"
              color={resolved ? 'success' : 'error'}
              variant={resolved ? 'outlined' : 'filled'}
              onDelete={isAdmin ? () => onRemoveBlocker(b.id) : undefined}
              onClick={() => navigate(`/epics/${b.id}`)}
              sx={{ cursor: 'pointer', height: 20, fontSize: '0.68rem' }}
            />
          );
        })}

        {isAdmin && (
          <Button size="small" startIcon={<Add />} onClick={onAddBlocker} sx={{ ml: 'auto', py: 0.25 }}>
            Add Blocker
          </Button>
        )}
      </Box>

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
