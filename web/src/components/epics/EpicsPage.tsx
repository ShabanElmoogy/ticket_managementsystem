import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip,
  IconButton, Tooltip, TextField, InputAdornment, FormControl,
  InputLabel, Select, MenuItem, Snackbar, Alert, CircularProgress,
  ToggleButton, ToggleButtonGroup, Checkbox, Collapse, Autocomplete,
} from '@mui/material';
import { Add, Search, Edit, Delete, OpenInNew, Apps, Person, CalendarToday, AccountTree, ViewList, Timeline, CheckBox, CheckBoxOutlineBlank, IndeterminateCheckBox, ArrowUpward, ArrowDownward, Lock, Label, FileDownload, ViewModule, Dashboard, PictureAsPdf, Hub } from '@mui/icons-material';
import EpicRoadmap from './components/EpicRoadmap';
import EpicHealthScore from './components/EpicHealthScore';
import EpicBoard from './components/EpicBoard';
import EpicDashboard from './components/EpicDashboard';
import EpicNetworkView from './components/EpicNetworkView';
import { exportMultipleEpicsToCsv } from './utils/exportEpicCsv';
import { generateEpicsReport } from '../../utils/reports/epicsReport';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { epicsApi } from './api/epics';
import EpicStatusChip from './components/EpicStatusChip';
import EpicPriorityChip from './components/EpicPriorityChip';
import EpicFormDialog from './components/EpicFormDialog';
import type { Epic, CreateEpicData, UpdateEpicData } from '../../services/api/types';
import { epicTemplatesApi } from './api/epicTemplates';
import { useIsAdmin } from '../../stores/authStore';
import { DeleteConfirmDialog } from '../common';

const STATUSES: Array<Epic['status'] | ''> = ['', 'DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

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

const EpicsPage: React.FC = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Epic['status'] | ''>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'targetDate' | 'featureCount' | 'progress' | 'priority'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Epic | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Epic | null>(null);
  const [view, setView] = useState<'list' | 'roadmap' | 'board' | 'dashboard' | 'network'>(
    () => (localStorage.getItem('epics-view') as 'list' | 'roadmap' | 'board' | 'dashboard' | 'network') ?? 'list'
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<Epic['status'] | ''>('');
  const [tagFilter, setTagFilter] = useState('');

  const { data: epics = [], isLoading } = useQuery({ queryKey: ['epics'], queryFn: () => epicsApi.list() });

  const createMutation = useMutation({
    mutationFn: (data: CreateEpicData) => epicsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['epics'] }); setSnack({ msg: 'Epic created', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to create', severity: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEpicData }) => epicsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['epics'] }); setSnack({ msg: 'Epic updated', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to update', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => epicsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['epics'] }); setSnack({ msg: 'Epic deleted', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to delete', severity: 'error' }),
  });

  const handleSubmit = async (data: CreateEpicData | UpdateEpicData, templateId?: string) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: data as UpdateEpicData });
    } else {
      const created = await createMutation.mutateAsync(data as CreateEpicData);
      if (templateId && created?.id) {
        try {
          await epicTemplatesApi.apply(created.id, templateId);
          qc.invalidateQueries({ queryKey: ['epics'] });
          qc.invalidateQueries({ queryKey: ['features'] });
        } catch {
          // template apply failure is non-fatal
        }
      }
    }
  };

  const filtered = epics
    .filter((e) => !statusFilter || e.status === statusFilter)
    .filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => !tagFilter || (e.tags ?? []).includes(tagFilter))
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === 'targetDate') {
        const da = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
        const db = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
        diff = da - db;
      } else if (sortBy === 'featureCount') {
        diff = a.featureCount - b.featureCount;
      } else if (sortBy === 'progress') {
        const pa = a.stepsTotal ? a.stepsDone / a.stepsTotal : 0;
        const pb = b.stepsTotal ? b.stepsDone / b.stepsTotal : 0;
        diff = pa - pb;
      } else if (sortBy === 'priority') {
        const order = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
        diff = (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
      } else {
        diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === 'asc' ? diff : -diff;
    });

  const allTags = [...new Set(epics.flatMap((e) => e.tags ?? []))].sort();
  const statCounts = (['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as Epic['status'][]).map((s) => ({
    status: s, count: epics.filter((e) => e.status === s).length,
  }));

  const allFilteredIds = filtered.map((e) => e.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));
  const someSelected = allFilteredIds.some((id) => selected.has(id)) && !allSelected;

  const toggleOne = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allFilteredIds));

  const bulkMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: Epic['status'] }) => epicsApi.bulkUpdateStatus(ids, status),
    onSuccess: (_, { ids, status }) => {
      qc.invalidateQueries({ queryKey: ['epics'] });
      setSelected(new Set());
      setBulkStatus('');
      setSnack({ msg: `${ids.length} epic${ids.length !== 1 ? 's' : ''} updated to ${status}`, severity: 'success' });
    },
    onError: () => setSnack({ msg: 'Bulk update failed', severity: 'error' }),
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1.5}>
        {/* Title */}
        <Box display="flex" alignItems="center" gap={1}>
          <AccountTree color="primary" sx={{ fontSize: { xs: 26, md: 32 } }} />
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', md: '1.5rem' } }}>Epics</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Large goals that group feature requests
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          {/* View toggle */}
          <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => { if (v) { setView(v); localStorage.setItem('epics-view', v); } }}>
            <ToggleButton value="list"><Tooltip title="List"><ViewList fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="board"><Tooltip title="Board"><ViewModule fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="roadmap"><Tooltip title="Roadmap"><Timeline fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="dashboard"><Tooltip title="Dashboard"><Dashboard fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="network"><Tooltip title="Network"><Hub fontSize="small" /></Tooltip></ToggleButton>
          </ToggleButtonGroup>

          {/* Export CSV — icon-only on xs */}
          <Tooltip title="Export all epics to CSV">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownload />}
                onClick={() => exportMultipleEpicsToCsv(filtered)}
                disabled={filtered.length === 0}
                sx={{ minWidth: 0 }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Export CSV</Box>
              </Button>
            </span>
          </Tooltip>

          {/* Export PDF — icon-only on xs, admin only */}
          {isAdmin && (
            <Tooltip title="Export epics to PDF">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<PictureAsPdf />}
                  onClick={() => generateEpicsReport(filtered, {
                    title: 'Epics Report',
                    filters: {
                      ...(statusFilter ? { Status: statusFilter } : {}),
                      ...(search ? { Search: search } : {}),
                      ...(tagFilter ? { Tag: tagFilter } : {}),
                    },
                  })}
                  disabled={filtered.length === 0}
                  sx={{ minWidth: 0 }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Export PDF</Box>
                </Button>
              </span>
            </Tooltip>
          )}

          {/* New Epic */}
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setDialogOpen(true); }}
              sx={{ minWidth: 0 }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>New Epic</Box>
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats row */}
      <Box display="flex" gap={1.5} mb={3} flexWrap="wrap">
        {statCounts.map(({ status, count }) => (
          <Paper
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            sx={{ px: 2, py: 1.5, borderRadius: 2, flex: '1 1 80px', textAlign: 'center', cursor: 'pointer',
              border: '1px solid', borderColor: statusFilter === status ? 'primary.main' : 'divider' }}
          >
            <Typography variant="h6" fontWeight={700}>{count}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
              {status}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 3, borderRadius: 3 }}>
        <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
          <TextField
            size="small" placeholder="Search epics…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: '1 1 160px', minWidth: 0 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ flex: '1 1 120px', minWidth: 0 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as Epic['status'] | '')}>
              {STATUSES.map((s) => <MenuItem key={s} value={s}>{s || 'All'}</MenuItem>)}
            </Select>
          </FormControl>
          <Autocomplete
            size="small"
            sx={{ flex: '1 1 140px', minWidth: 0 }}
            options={allTags}
            value={tagFilter || null}
            onChange={(_, v) => setTagFilter(v ?? '')}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Tag…"
                InputProps={{ ...params.InputProps, startAdornment: <><Label fontSize="small" sx={{ ml: 0.5, mr: 0.5, color: 'text.secondary' }} />{params.InputProps.startAdornment}</> }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}><Chip label={option} size="small" sx={{ pointerEvents: 'none' }} /></li>
            )}
          />
          <Box display="flex" gap={1} alignItems="center" sx={{ flex: '1 1 160px', minWidth: 0 }}>
            <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
              <InputLabel>Sort by</InputLabel>
              <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <MenuItem value="createdAt">Date Created</MenuItem>
                <MenuItem value="targetDate">Target Date</MenuItem>
                <MenuItem value="featureCount">Features</MenuItem>
                <MenuItem value="progress">Progress</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title={sortDir === 'asc' ? 'Ascending' : 'Descending'}>
              <IconButton size="small" onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}>
                {sortDir === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Roadmap view */}
      {!isLoading && view === 'roadmap' && (
        <Box sx={{ overflowX: 'auto' }}>
          <EpicRoadmap epics={filtered} />
        </Box>
      )}

      {/* Board view */}
      {!isLoading && view === 'board' && (
        <Box sx={{ height: { xs: 'calc(100vh - 200px)', md: 'calc(100vh - 280px)' }, minHeight: { xs: 400, md: 600 } }}>
          <EpicBoard epics={filtered} isAdmin={isAdmin} />
        </Box>
      )}

      {/* Dashboard view */}
      {!isLoading && view === 'dashboard' && (
        <EpicDashboard epics={filtered} />
      )}

      {/* Network view */}
      {!isLoading && view === 'network' && (
        <EpicNetworkView />
      )}

      {/* Bulk action bar */}
      <Collapse in={selected.size > 0}>
        <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'primary.main', bgcolor: 'primary.50' }}>
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Typography variant="body2" fontWeight={600}>{selected.size} selected</Typography>
            <FormControl size="small" sx={{ flex: '1 1 130px', minWidth: 0 }}>
              <InputLabel>Change Status</InputLabel>
              <Select value={bulkStatus} label="Change Status" onChange={(e) => setBulkStatus(e.target.value as Epic['status'])}>
                {(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as Epic['status'][]).map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained" size="small"
              disabled={!bulkStatus || bulkMutation.isPending}
              onClick={() => bulkMutation.mutate({ ids: Array.from(selected), status: bulkStatus as Epic['status'] })}
            >
              {bulkMutation.isPending ? 'Updating…' : 'Apply'}
            </Button>
            <Button size="small" onClick={() => { setSelected(new Set()); setBulkStatus(''); }}>Clear</Button>
          </Box>
        </Paper>
      </Collapse>

      {/* List view */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : view === 'roadmap' || view === 'board' || view === 'dashboard' || view === 'network' ? null : filtered.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <AccountTree sx={{ fontSize: 56, color: 'text.secondary', mb: 1 }} />
          {epics.length === 0 ? (
            <>
              <Typography variant="h6" color="text.secondary">No epics yet</Typography>
              <Typography variant="body2" color="text.secondary">Create an epic to group your feature requests</Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" color="text.secondary">No epics match your filters</Typography>
              <Button size="small" sx={{ mt: 1 }} onClick={() => { setSearch(''); setStatusFilter(''); setTagFilter(''); }}>
                Clear filters
              </Button>
            </>
          )}
        </Paper>
      ) : (
        <>
          {/* Select all row */}
          <Box display="flex" alignItems="center" gap={1} mb={1} px={0.5}>
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={someSelected}
              onChange={toggleAll}
              icon={<CheckBoxOutlineBlank fontSize="small" />}
              checkedIcon={<CheckBox fontSize="small" />}
              indeterminateIcon={<IndeterminateCheckBox fontSize="small" />}
            />
            <Typography variant="caption" color="text.secondary">
              {allSelected ? 'Deselect all' : `Select all (${filtered.length})`}
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {filtered.map((epic) => {
          const progress = epic.stepsTotal ? Math.round((epic.stepsDone / epic.stepsTotal) * 100) : 0;
          const overdue = epic.targetDate && new Date(epic.targetDate) < new Date() && epic.status !== 'COMPLETED';
          const isSelected = selected.has(epic.id);
          const isBlocked = epic.blockedBy?.some((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
          const dueDiff = (() => {
            if (!epic.targetDate) return null;
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const target = new Date(epic.targetDate); target.setHours(0, 0, 0, 0);
            return Math.round((target.getTime() - today.getTime()) / 86400000);
          })();
          const dueDateLabel = dueDiff === null ? null
            : dueDiff === 0 ? 'Due today'
            : dueDiff < 0 ? `${Math.abs(dueDiff)}d overdue`
            : `${dueDiff}d left`;

          const STATUS_ACCENT: Record<Epic['status'], string> = {
            DRAFT: '#9e9e9e', ACTIVE: '#1976d2', COMPLETED: '#2e7d32', CANCELLED: '#d32f2f',
          };
          const accent = STATUS_ACCENT[epic.status];

          return (
            <Paper
              key={epic.id}
              onClick={() => navigate(`/epics/${epic.id}`)}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.15s',
                '&:hover': { borderColor: 'primary.main', boxShadow: 4, transform: 'translateY(-1px)' },
              }}
            >
              {/* Accent bar + header */}
              <Box sx={{ borderLeft: `4px solid ${accent}`, px: { xs: 1.5, sm: 2 }, pt: 1.75, pb: 1.25 }}>
                <Box display="flex" alignItems="flex-start" gap={1}>
                  {/* Checkbox */}
                  <Box onClick={(e) => { e.stopPropagation(); toggleOne(epic.id); }} sx={{ mt: 0.25, flexShrink: 0 }}>
                    <Checkbox size="small" checked={isSelected} onChange={() => toggleOne(epic.id)} sx={{ p: 0.25 }} />
                  </Box>

                  {/* Title + badges */}
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" alignItems="center" gap={0.75} mb={0.5} flexWrap="wrap">
                      <Typography
                        variant="subtitle1" fontWeight={700}
                        sx={{ flex: 1, minWidth: 0, fontSize: { xs: '0.9rem', sm: '1rem' }, lineHeight: 1.3 }}
                        noWrap
                      >
                        {epic.title}
                      </Typography>
                      <EpicHealthScore epic={epic} />
                      <EpicPriorityChip priority={epic.priority} />
                      <EpicStatusChip status={epic.status} />
                      {isBlocked && (
                        <Tooltip title={`Blocked by: ${epic.blockedBy!.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').map((b) => b.title).join(', ')}`}>
                          <Lock sx={{ fontSize: 14, color: 'error.main', flexShrink: 0 }} />
                        </Tooltip>
                      )}
                    </Box>

                    {epic.description && (
                      <Typography
                        variant="body2" color="text.secondary"
                        sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontSize: '0.8rem', lineHeight: 1.5, mb: 0.75 }}
                      >
                        {epic.description}
                      </Typography>
                    )}
                  </Box>

                  {/* Desktop actions */}
                  {isAdmin && (
                    <Box display={{ xs: 'none', sm: 'flex' }} flexDirection="column" gap={0.25}
                      onClick={(e) => e.stopPropagation()} flexShrink={0} sx={{ ml: 0.5 }}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/epics/${epic.id}`)} sx={{ p: 0.5 }}><OpenInNew sx={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => { setEditing(epic); setDialogOpen(true); }} sx={{ p: 0.5 }}><Edit sx={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(epic)} sx={{ p: 0.5 }}><Delete sx={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Meta row */}
              <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
                {epic.applicationName && (
                  <Chip icon={<Apps sx={{ fontSize: '0.7rem !important' }} />} label={epic.applicationName}
                    size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                )}
                {epic.customerName && (
                  <Chip icon={<Person sx={{ fontSize: '0.7rem !important' }} />} label={epic.customerName}
                    size="small" variant="outlined" color="secondary" sx={{ height: 20, fontSize: '0.65rem' }} />
                )}
                {epic.ownerName && (
                  <Chip icon={<Person sx={{ fontSize: '0.7rem !important' }} />} label={epic.ownerName}
                    size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
                )}
                {epic.targetDate && (
                  <Chip
                    icon={<CalendarToday sx={{ fontSize: '0.7rem !important' }} />}
                    label={dueDateLabel}
                    size="small" variant="outlined"
                    color={overdue ? 'error' : dueDiff === 0 ? 'warning' : 'default'}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}
                <Chip label={`${epic.featureCount} feature${epic.featureCount !== 1 ? 's' : ''}`}
                  size="small" sx={{ height: 20, fontSize: '0.65rem', ml: 'auto' }} />
              </Box>

              {/* Tags */}
              {(epic.tags ?? []).length > 0 && (
                <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {epic.tags!.map((t) => (
                    <Chip
                      key={t} label={t} size="small" variant="outlined"
                      onClick={(e) => { e.stopPropagation(); setTagFilter(tagFilter === t ? '' : t); }}
                      sx={{
                        height: 16, fontSize: '0.6rem',
                        borderColor: tagFilter === t ? 'primary.main' : 'divider',
                        color: tagFilter === t ? 'primary.main' : 'text.secondary',
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Progress bar + legend */}
              {epic.featureCount > 0 && (() => {
                const counts = Object.entries(epic.featureStatusCounts ?? {}) as [string, number][];
                const total = epic.featureCount;
                if (!counts.length) return null;
                return (
                  <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 1.5 }}>
                    {epic.stepsTotal > 0 && (
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Steps</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{epic.stepsDone}/{epic.stepsTotal} · {progress}%</Typography>
                      </Box>
                    )}
                    <Box display="flex" height={5} borderRadius={1} overflow="hidden" mb={0.75}>
                      {counts.map(([status, count]) => (
                        <Tooltip key={status} title={`${FEATURE_STATUS_LABELS[status] ?? status}: ${count}`}>
                          <Box sx={{ width: `${(count / total) * 100}%`, bgcolor: FEATURE_STATUS_COLORS[status] ?? 'grey.400', transition: 'width 0.3s' }} />
                        </Tooltip>
                      ))}
                    </Box>
                    <Box display="flex" gap={1.25} flexWrap="wrap">
                      {counts.map(([status, count]) => (
                        <Box key={status} display="flex" alignItems="center" gap={0.4}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: FEATURE_STATUS_COLORS[status] ?? 'grey.400', flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                            {FEATURE_STATUS_LABELS[status] ?? status} <strong>{count}</strong>
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })()}

              {/* Mobile action row */}
              {isAdmin && (
                <Box
                  display={{ xs: 'flex', sm: 'none' }}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ px: 1, pb: 0.75, pt: 0.25, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'flex-end', gap: 0.5 }}
                >
                  <Tooltip title="View">
                    <IconButton size="small" onClick={() => navigate(`/epics/${epic.id}`)}><OpenInNew sx={{ fontSize: 16 }} /></IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => { setEditing(epic); setDialogOpen(true); }}><Edit sx={{ fontSize: 16 }} /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(epic)}><Delete sx={{ fontSize: 16 }} /></IconButton>
                  </Tooltip>
                </Box>
              )}
            </Paper>
          );
        })}
          </Box>
        </>
      )}

      <EpicFormDialog open={dialogOpen} editing={editing} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit} />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteMutation.mutate(deleteTarget!.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.title}
        itemType="epic"
        loading={deleteMutation.isPending}
      />

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EpicsPage;
