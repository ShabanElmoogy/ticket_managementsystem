import React, { useMemo } from 'react';
import {
  Box, Paper, Typography, LinearProgress, Chip, Tooltip,
  useTheme, alpha, Grid,
} from '@mui/material';
import {
  CheckCircle, Cancel, PlayArrow, DraftsTwoTone,
  TrendingUp, Warning, Block, CalendarToday, AccountTree,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { calculateEpicHealthScore } from '../utils/epicHealthScore';
import EpicPriorityChip from './EpicPriorityChip';
import EpicStatusChip from './EpicStatusChip';
import { formatDate } from '../../../utils/dateUtils';
import type { Epic } from '../../../services/api/types';

const FEATURE_STATUS_COLORS: Record<string, string> = {
  UNDER_REVIEW: '#9e9e9e',
  PLANNED:      '#29b6f6',
  IN_PROGRESS:  '#1976d2',
  SHIPPED:      '#2e7d32',
  DECLINED:     '#d32f2f',
};

const FEATURE_STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: 'Under Review',
  PLANNED:      'Planned',
  IN_PROGRESS:  'In Progress',
  SHIPPED:      'Shipped',
  DECLINED:     'Declined',
};

interface Props {
  epics: Epic[];
}

const EpicDashboard: React.FC<Props> = ({ epics }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const byStatus = { DRAFT: 0, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
    const byPriority = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    let totalFeatures = 0;
    let totalSteps = 0;
    let doneSteps = 0;
    let overdueCount = 0;
    let blockedCount = 0;
    const featureStatusTotals: Record<string, number> = {};
    const today = new Date(); today.setHours(0, 0, 0, 0);

    for (const e of epics) {
      byStatus[e.status]++;
      byPriority[e.priority]++;
      totalFeatures += e.featureCount;
      totalSteps += e.stepsTotal;
      doneSteps += e.stepsDone;
      if (e.targetDate && new Date(e.targetDate) < today && e.status !== 'COMPLETED' && e.status !== 'CANCELLED') {
        overdueCount++;
      }
      if (e.blockedBy?.some(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED')) {
        blockedCount++;
      }
      for (const [k, v] of Object.entries(e.featureStatusCounts ?? {})) {
        featureStatusTotals[k] = (featureStatusTotals[k] ?? 0) + (v as number);
      }
    }

    const overallProgress = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
    return { byStatus, byPriority, totalFeatures, overallProgress, overdueCount, blockedCount, featureStatusTotals };
  }, [epics]);

  // ── Health buckets ───────────────────────────────────────────────────────
  const healthBuckets = useMemo(() => {
    const buckets = { healthy: 0, atRisk: 0, critical: 0 };
    for (const e of epics) {
      const h = calculateEpicHealthScore({ ...e, blockedBy: e.blockedBy ?? [], featureCount: e.featureCount, stepsTotal: e.stepsTotal, stepsDone: e.stepsDone }, []);
      if (h.color === 'success') buckets.healthy++;
      else if (h.color === 'warning') buckets.atRisk++;
      else buckets.critical++;
    }
    return buckets;
  }, [epics]);

  // ── Epics needing attention ──────────────────────────────────────────────
  const attention = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return epics
      .filter(e => e.status === 'ACTIVE')
      .map(e => {
        const health = calculateEpicHealthScore({ ...e, blockedBy: e.blockedBy ?? [], featureCount: e.featureCount, stepsTotal: e.stepsTotal, stepsDone: e.stepsDone }, []);
        const daysLeft = e.targetDate ? Math.round((new Date(e.targetDate).getTime() - today.getTime()) / 86_400_000) : null;
        return { ...e, health, daysLeft };
      })
      .filter(e => e.health.color !== 'success')
      .sort((a, b) => a.health.score - b.health.score)
      .slice(0, 5);
  }, [epics]);

  // ── Recently updated ────────────────────────────────────────────────────
  const recent = useMemo(() =>
    [...epics].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5),
    [epics]
  );

  if (epics.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
        <AccountTree sx={{ fontSize: 56, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" color="text.secondary">No epics to display</Typography>
      </Paper>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {/* ── Row 1: Status + Priority + Health + Progress ── */}
      <Box display="grid" sx={{ gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>

        {/* Status breakdown */}
        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
            By Status
          </Typography>
          <Box display="flex" flexDirection="column" gap={1} mt={1.5}>
            {([
              { key: 'ACTIVE',    label: 'Active',    icon: <PlayArrow sx={{ fontSize: 14 }} />,         color: '#1976d2' },
              { key: 'DRAFT',     label: 'Draft',     icon: <DraftsTwoTone sx={{ fontSize: 14 }} />,     color: '#9e9e9e' },
              { key: 'COMPLETED', label: 'Completed', icon: <CheckCircle sx={{ fontSize: 14 }} />,       color: '#2e7d32' },
              { key: 'CANCELLED', label: 'Cancelled', icon: <Cancel sx={{ fontSize: 14 }} />,            color: '#d32f2f' },
            ] as const).map(({ key, label, icon, color }) => (
              <Box key={key} display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={0.75} sx={{ color }}>
                  {icon}
                  <Typography variant="body2">{label}</Typography>
                </Box>
                <Typography variant="body2" fontWeight={700}>{stats.byStatus[key]}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Priority breakdown */}
        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
            By Priority
          </Typography>
          <Box display="flex" flexDirection="column" gap={1} mt={1.5}>
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Epic['priority'][]).map(p => (
              <Box key={p} display="flex" alignItems="center" justifyContent="space-between">
                <EpicPriorityChip priority={p} />
                <Typography variant="body2" fontWeight={700}>{stats.byPriority[p]}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Health overview */}
        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
            Health Overview
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.5} mt={1.5}>
            {([
              { key: 'healthy', label: 'Healthy',  color: theme.palette.success.main },
              { key: 'atRisk',  label: 'At Risk',  color: theme.palette.warning.main },
              { key: 'critical',label: 'Critical', color: theme.palette.error.main },
            ] as const).map(({ key, label, color }) => (
              <Box key={key}>
                <Box display="flex" justifyContent="space-between" mb={0.25}>
                  <Typography variant="caption" sx={{ color }}>{label}</Typography>
                  <Typography variant="caption" fontWeight={700}>{healthBuckets[key]}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={epics.length > 0 ? (healthBuckets[key] / epics.length) * 100 : 0}
                  sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }}
                />
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Overall progress + alerts */}
        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
            Overall Progress
          </Typography>
          <Box mt={1.5}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="h4" fontWeight={800} color="primary">{stats.overallProgress}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.overallProgress}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                  <AccountTree sx={{ fontSize: 14 }} />
                  <Typography variant="caption">Total features</Typography>
                </Box>
                <Typography variant="caption" fontWeight={700}>{stats.totalFeatures}</Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={0.5} color="error.main">
                  <CalendarToday sx={{ fontSize: 14 }} />
                  <Typography variant="caption">Overdue</Typography>
                </Box>
                <Typography variant="caption" fontWeight={700} color="error.main">{stats.overdueCount}</Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={0.5} color="warning.main">
                  <Block sx={{ fontSize: 14 }} />
                  <Typography variant="caption">Blocked</Typography>
                </Box>
                <Typography variant="caption" fontWeight={700} color="warning.main">{stats.blockedCount}</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* ── Row 2: Feature status breakdown ── */}
      {Object.keys(stats.featureStatusTotals).length > 0 && (
        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5} display="block" mb={1.5}>
            Feature Status Distribution
          </Typography>
          <Box display="flex" height={12} borderRadius={2} overflow="hidden" mb={1.5}>
            {Object.entries(stats.featureStatusTotals).map(([status, count]) => (
              <Tooltip key={status} title={`${FEATURE_STATUS_LABELS[status] ?? status}: ${count}`}>
                <Box sx={{
                  width: `${(count / stats.totalFeatures) * 100}%`,
                  bgcolor: FEATURE_STATUS_COLORS[status] ?? 'grey.400',
                  transition: 'width 0.3s',
                  '&:hover': { filter: 'brightness(1.15)' },
                }} />
              </Tooltip>
            ))}
          </Box>
          <Box display="flex" gap={2.5} flexWrap="wrap">
            {Object.entries(stats.featureStatusTotals).map(([status, count]) => (
              <Box key={status} display="flex" alignItems="center" gap={0.75}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: FEATURE_STATUS_COLORS[status] ?? 'grey.400', flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary">
                  {FEATURE_STATUS_LABELS[status] ?? status}
                </Typography>
                <Typography variant="caption" fontWeight={700}>{count}</Typography>
                <Typography variant="caption" color="text.disabled">
                  ({Math.round((count / stats.totalFeatures) * 100)}%)
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* ── Row 3: Needs attention + Recently updated ── */}
      <Box display="grid" sx={{ gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>

        {/* Needs attention */}
        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Warning sx={{ fontSize: 18, color: 'warning.main' }} />
            <Typography variant="subtitle2" fontWeight={700}>Needs Attention</Typography>
            <Chip label={attention.length} size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
          </Box>
          {attention.length === 0 ? (
            <Box display="flex" alignItems="center" gap={1} color="success.main">
              <CheckCircle sx={{ fontSize: 16 }} />
              <Typography variant="body2">All active epics are healthy</Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {attention.map(epic => (
                <Box
                  key={epic.id}
                  onClick={() => navigate(`/epics/${epic.id}`)}
                  sx={{
                    p: 1.5, borderRadius: 2, cursor: 'pointer',
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: alpha(epic.health.color === 'error' ? theme.palette.error.main : theme.palette.warning.main, 0.04),
                    '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={0.5}>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>{epic.title}</Typography>
                    <Chip
                      label={`${epic.health.score}%`}
                      size="small"
                      color={epic.health.color}
                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <EpicPriorityChip priority={epic.priority} />
                    {epic.daysLeft !== null && (
                      <Typography variant="caption" color={epic.daysLeft < 0 ? 'error.main' : 'text.secondary'}>
                        {epic.daysLeft < 0 ? `${Math.abs(epic.daysLeft)}d overdue` : `${epic.daysLeft}d left`}
                      </Typography>
                    )}
                    {epic.blockedBy?.some(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED') && (
                      <Chip icon={<Block sx={{ fontSize: '0.7rem !important' }} />} label="Blocked" size="small" color="error" variant="outlined" sx={{ height: 16, fontSize: '0.6rem' }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Recently updated */}
        <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <TrendingUp sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" fontWeight={700}>Recently Updated</Typography>
          </Box>
          <Box display="flex" flexDirection="column" gap={1.5}>
            {recent.map(epic => (
              <Box
                key={epic.id}
                onClick={() => navigate(`/epics/${epic.id}`)}
                sx={{
                  p: 1.5, borderRadius: 2, cursor: 'pointer',
                  border: '1px solid', borderColor: 'divider',
                  '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={0.5}>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>{epic.title}</Typography>
                  <EpicStatusChip status={epic.status} />
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" color="text.secondary">
                    Updated {formatDate(epic.updatedAt)}
                  </Typography>
                  {epic.featureCount > 0 && (
                    <Chip label={`${epic.featureCount} features`} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default EpicDashboard;
