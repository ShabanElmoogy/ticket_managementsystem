import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, LinearProgress,
  IconButton, Tooltip, TextField, InputAdornment, FormControl,
  InputLabel, Select, MenuItem, Snackbar, Alert, CircularProgress,
  ToggleButton, ToggleButtonGroup, Checkbox, Collapse,
} from '@mui/material';
import { Add, Search, Edit, Delete, OpenInNew, Apps, Person, CalendarToday, AccountTree, ViewList, Timeline, CheckBox, CheckBoxOutlineBlank, IndeterminateCheckBox } from '@mui/icons-material';
import EpicRoadmap from './components/EpicRoadmap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { epicsApi } from './api/epics';
import EpicStatusChip from './components/EpicStatusChip';
import EpicFormDialog from './components/EpicFormDialog';
import type { Epic, CreateEpicData, UpdateEpicData } from '../../services/api/types';
import { useIsAdmin } from '../../stores/authStore';
import { DeleteConfirmDialog } from '../common';

const STATUSES: Array<Epic['status'] | ''> = ['', 'DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

const EpicsPage: React.FC = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Epic['status'] | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Epic | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Epic | null>(null);
  const [view, setView] = useState<'list' | 'roadmap'>(
    () => (localStorage.getItem('epics-view') as 'list' | 'roadmap') ?? 'list'
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<Epic['status'] | ''>('');

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

  const handleSubmit = async (data: CreateEpicData | UpdateEpicData) => {
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data: data as UpdateEpicData });
    else await createMutation.mutateAsync(data as CreateEpicData);
  };

  const filtered = epics
    .filter((e) => !statusFilter || e.status === statusFilter)
    .filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()));

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
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <AccountTree color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Epics</Typography>
            <Typography variant="body2" color="text.secondary">Large goals that group feature requests</Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => { if (v) { setView(v); localStorage.setItem('epics-view', v); } }}>
            <ToggleButton value="list"><Tooltip title="List"><ViewList fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="roadmap"><Tooltip title="Roadmap"><Timeline fontSize="small" /></Tooltip></ToggleButton>
          </ToggleButtonGroup>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setDialogOpen(true); }}>
              New Epic
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats row */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {statCounts.map(({ status, count }) => (
          <Paper
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            sx={{ px: 2, py: 1.5, borderRadius: 2, flex: '1 1 100px', textAlign: 'center', cursor: 'pointer',
              border: '1px solid', borderColor: statusFilter === status ? 'primary.main' : 'divider' }}
          >
            <Typography variant="h6" fontWeight={700}>{count}</Typography>
            <Typography variant="caption" color="text.secondary">{status}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
          <TextField
            size="small" placeholder="Search epics…" value={search}
            onChange={(e) => setSearch(e.target.value)} sx={{ flex: '1 1 200px' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ flex: '1 1 140px' }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as Epic['status'] | '')}>
              {STATUSES.map((s) => <MenuItem key={s} value={s}>{s || 'All'}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Roadmap view */}
      {!isLoading && view === 'roadmap' && (
        <Box sx={{ overflowX: 'auto' }}>
          <EpicRoadmap epics={filtered} />
        </Box>
      )}

      {/* Bulk action bar */}
      <Collapse in={selected.size > 0}>
        <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'primary.main', bgcolor: 'primary.50' }}>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Typography variant="body2" fontWeight={600}>{selected.size} selected</Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
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
      ) : view === 'roadmap' ? null : filtered.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <AccountTree sx={{ fontSize: 56, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">No epics yet</Typography>
          <Typography variant="body2" color="text.secondary">Create an epic to group your feature requests</Typography>
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
          {filtered.map((epic) => {
          const progress = epic.stepsTotal ? Math.round((epic.stepsDone / epic.stepsTotal) * 100) : 0;
          const overdue = epic.targetDate && new Date(epic.targetDate) < new Date() && epic.status !== 'COMPLETED';
          const isSelected = selected.has(epic.id);
          return (
            <Paper key={epic.id} sx={{ mb: 2, p: 2.5, borderRadius: 3, border: '1px solid',
              borderColor: isSelected ? 'primary.main' : 'divider',
              cursor: 'pointer', '&:hover': { borderColor: 'primary.main', boxShadow: 2 } }}
              onClick={() => navigate(`/epics/${epic.id}`)}
            >
              <Box display="flex" alignItems="flex-start" gap={2}>
                {/* Checkbox */}
                <Box onClick={(e) => { e.stopPropagation(); toggleOne(epic.id); }} sx={{ mt: 0.5 }}>
                  <Checkbox size="small" checked={isSelected} onChange={() => toggleOne(epic.id)} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>{epic.title}</Typography>
                    <EpicStatusChip status={epic.status} />
                  </Box>

                  {epic.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {epic.description}
                    </Typography>
                  )}

                  {/* Meta chips */}
                  <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
                    {epic.applicationName && <Chip icon={<Apps fontSize="small" />} label={epic.applicationName} size="small" variant="outlined" />}
                    {epic.customerName && <Chip icon={<Person fontSize="small" />} label={epic.customerName} size="small" variant="outlined" color="secondary" />}
                    {epic.ownerName && <Chip icon={<Person fontSize="small" />} label={`Owner: ${epic.ownerName}`} size="small" variant="outlined" color="primary" />}
                    {epic.targetDate && (
                      <Chip icon={<CalendarToday fontSize="small" />} label={new Date(epic.targetDate).toLocaleDateString()}
                        size="small" variant="outlined" color={overdue ? 'error' : 'default'} />
                    )}
                    <Chip label={`${epic.featureCount} feature${epic.featureCount !== 1 ? 's' : ''}`} size="small" />
                  </Box>

                  {/* Progress */}
                  {epic.stepsTotal > 0 && (
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">Progress</Typography>
                        <Typography variant="caption" color="text.secondary">{epic.stepsDone}/{epic.stepsTotal} steps · {progress}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1, height: 6 }} color={progress === 100 ? 'success' : 'primary'} />
                    </Box>
                  )}
                </Box>

                {/* Actions */}
                {isAdmin && (
                  <Box display="flex" flexDirection="column" gap={0.5} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => navigate(`/epics/${epic.id}`)}><OpenInNew fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => { setEditing(epic); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(epic)}><Delete fontSize="small" /></IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}
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
