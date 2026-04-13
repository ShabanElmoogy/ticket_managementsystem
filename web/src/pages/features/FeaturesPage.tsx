import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, ToggleButtonGroup, ToggleButton,
  FormControl, InputLabel, Select, MenuItem, TextField,
  InputAdornment, Snackbar, Alert, CircularProgress, Paper,
} from '@mui/material';
import { Add, Search, Lightbulb } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featuresApi } from '../components/features/api/features';
import { applicationsApi } from '../components/admin/applicationsManagement';
import { customersApi } from '../components/admin/customersManagement';
import FeatureCard from '../components/features/components/FeatureCard';
import FeatureFormDialog from '../components/features/components/FeatureFormDialog';
import { epicsApi } from '../components/epics/api/epics';
import { useIsAdmin } from '../stores/authStore';
import type { FeatureRequest, CreateFeatureData, UpdateFeatureData } from '../services/api/types';

const STATUSES: Array<FeatureRequest['status'] | ''> = ['', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED'];

const FeaturesPage: React.FC = () => {
  const qc = useQueryClient();
  const isAdmin = useIsAdmin();

  const [statusFilter, setStatusFilter] = useState<FeatureRequest['status'] | ''>('');
  const [appFilter, setAppFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [epicFilter, setEpicFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'votes' | 'date'>('votes');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeatureRequest | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const { data: features = [], isLoading } = useQuery({
    queryKey: ['features'],
    queryFn: () => featuresApi.list(),
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
  });

  const { data: epics = [] } = useQuery({
    queryKey: ['epics'],
    queryFn: () => epicsApi.list(),
  });

  const filteredCustomers = useMemo(() => {
    if (!appFilter) return customers;
    return customers.filter((c) => c.applications?.some((ca) => ca.applicationId === appFilter));
  }, [customers, appFilter]);

  const createMutation = useMutation({
    mutationFn: (data: CreateFeatureData) => featuresApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['features'] }); setSnack({ msg: 'Feature request submitted!', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to submit', severity: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeatureData }) => featuresApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['features'] }); setSnack({ msg: 'Updated', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to update', severity: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => featuresApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['features'] }); setSnack({ msg: 'Deleted', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to delete', severity: 'error' }),
  });

  const voteMutation = useMutation({
    mutationFn: (id: string) => featuresApi.toggleVote(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['features'] });
      const prev = qc.getQueryData<FeatureRequest[]>(['features']);
      qc.setQueryData<FeatureRequest[]>(['features'], (old = []) =>
        old.map((f) => f.id === id
          ? { ...f, voteCount: f.votedByMe ? f.voteCount - 1 : f.voteCount + 1, votedByMe: !f.votedByMe }
          : f)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => { if (ctx?.prev) qc.setQueryData(['features'], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['features'] }),
  });

  const handleSubmit = async (data: CreateFeatureData | UpdateFeatureData) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: data as UpdateFeatureData });
    } else {
      await createMutation.mutateAsync(data as CreateFeatureData);
    }
  };

  const filtered = features
    .filter((f) => !statusFilter || f.status === statusFilter)
    .filter((f) => !appFilter || f.applicationId === appFilter)
    .filter((f) => !customerFilter || f.customerId === customerFilter)
    .filter((f) => !epicFilter || f.epicId === epicFilter)
    .filter((f) => !search || f.title.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'votes' ? b.voteCount - a.voteCount : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Lightbulb color="warning" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Feature Requests</Typography>
            <Typography variant="body2" color="text.secondary">
              Submit ideas, vote on what matters most
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setDialogOpen(true); }}>
          New Request
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: '1 1 180px' }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
          />

          <FormControl size="small" sx={{ flex: '1 1 140px' }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as FeatureRequest['status'] | '')}>
              {STATUSES.map((s) => <MenuItem key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All'}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: '1 1 140px' }}>
            <InputLabel>Application</InputLabel>
            <Select value={appFilter} label="Application" onChange={(e) => { setAppFilter(e.target.value); setCustomerFilter(''); }}>
              <MenuItem value="">All</MenuItem>
              {applications.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: '1 1 140px' }}>
            <InputLabel>Customer</InputLabel>
            <Select value={customerFilter} label="Customer" onChange={(e) => setCustomerFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {filteredCustomers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ flex: '1 1 140px' }}>
            <InputLabel>Epic</InputLabel>
            <Select value={epicFilter} label="Epic" onChange={(e) => setEpicFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {epics.map((e) => <MenuItem key={e.id} value={e.id}>{e.title}</MenuItem>)}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={sortBy}
            exclusive
            onChange={(_e, v) => v && setSortBy(v)}
            size="small"
          >
            <ToggleButton value="votes">Top Voted</ToggleButton>
            <ToggleButton value="date">Newest</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Stats row */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {(['UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED'] as FeatureRequest['status'][]).map((s) => {
          const c = features.filter((f) => f.status === s).length;
          return (
            <Paper key={s} sx={{ px: 2, py: 1, borderRadius: 2, flex: '1 1 100px', textAlign: 'center', cursor: 'pointer', border: '1px solid', borderColor: statusFilter === s ? 'primary.main' : 'divider' }}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}>
              <Typography variant="h6" fontWeight={700}>{c}</Typography>
              <Typography variant="caption" color="text.secondary">{s.replace('_', ' ')}</Typography>
            </Paper>
          );
        })}
      </Box>

      {/* List */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Lightbulb sx={{ fontSize: 56, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">No feature requests yet</Typography>
          <Typography variant="body2" color="text.secondary">Be the first to submit an idea!</Typography>
        </Paper>
      ) : (
        filtered.map((f) => (
          <FeatureCard
            key={f.id}
            feature={f}
            isAdmin={isAdmin}
            onVote={(id) => voteMutation.mutate(id)}
            onEdit={(feat) => { setEditing(feat); setDialogOpen(true); }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))
      )}

      <FeatureFormDialog
        open={dialogOpen}
        editing={editing}
        isAdmin={isAdmin}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FeaturesPage;
