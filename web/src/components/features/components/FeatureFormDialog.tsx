import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Stack,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '../../../components/admin/applicationsManagement/api/applications';
import { customersApi } from '../../../components/admin/customersManagement/api/customers';
import type { FeatureRequest, CreateFeatureData, UpdateFeatureData } from '../../../services/api/types';

const STATUSES: FeatureRequest['status'][] = ['UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED'];

interface Props {
  open: boolean;
  editing: FeatureRequest | null;
  isAdmin: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFeatureData | UpdateFeatureData) => Promise<void>;
}

const FeatureFormDialog: React.FC<Props> = ({ open, editing, isAdmin, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<FeatureRequest['status']>('UNDER_REVIEW');
  const [applicationId, setApplicationId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications(),
    enabled: open,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
    enabled: open,
  });

  // Filter customers that have the selected application assigned
  const filteredCustomers = useMemo(() => {
    if (!applicationId) return customers;
    return customers.filter((c) =>
      c.applications?.some((ca) => ca.applicationId === applicationId)
    );
  }, [customers, applicationId]);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description);
      setStatus(editing.status);
      setApplicationId(editing.applicationId ?? '');
      setCustomerId(editing.customerId ?? '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('UNDER_REVIEW');
      setApplicationId('');
      setCustomerId('');
    }
  }, [editing, open]);

  // Reset customer if it no longer belongs to the selected app
  useEffect(() => {
    if (customerId && applicationId) {
      const still = filteredCustomers.some((c) => c.id === customerId);
      if (!still) setCustomerId('');
    }
  }, [applicationId, filteredCustomers, customerId]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    try {
      const base = { title, description, applicationId: applicationId || null, customerId: customerId || null };
      const data: CreateFeatureData | UpdateFeatureData = editing ? { ...base, status } : base;
      await onSubmit(data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edit Feature Request' : 'New Feature Request'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth size="small" required
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth multiline minRows={4} size="small" required
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Application</InputLabel>
            <Select value={applicationId} label="Application" onChange={(e) => setApplicationId(e.target.value)}>
              <MenuItem value=""><em>None</em></MenuItem>
              {applications.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Customer</InputLabel>
            <Select value={customerId} label="Customer" onChange={(e) => setCustomerId(e.target.value)}>
              <MenuItem value=""><em>None</em></MenuItem>
              {filteredCustomers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>

          {editing && isAdmin && (
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as FeatureRequest['status'])}>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !title.trim() || !description.trim()}>
          {saving ? 'Saving…' : editing ? 'Save' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeatureFormDialog;
