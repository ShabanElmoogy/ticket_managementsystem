import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Stack,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '../../admin/applicationsManagement/api/applications';
import { customersApi } from '../../admin/customersManagement/api/customers';
import { usersApi } from '../../admin/usersManagement/api/users';
import type { Epic, CreateEpicData, UpdateEpicData } from '../../../services/api/types';

const STATUSES: Epic['status'][] = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

interface Props {
  open: boolean;
  editing: Epic | null;
  onClose: () => void;
  onSubmit: (data: CreateEpicData | UpdateEpicData) => Promise<void>;
}

const EpicFormDialog: React.FC<Props> = ({ open, editing, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Epic['status']>('DRAFT');
  const [ownerId, setOwnerId] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: applications = [] } = useQuery({ queryKey: ['applications'], queryFn: () => applicationsApi.getApplications(), enabled: open });
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => customersApi.getCustomers(), enabled: open });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => usersApi.getEmployees(), enabled: open });

  const filteredCustomers = useMemo(() =>
    applicationId ? customers.filter((c) => c.applications?.some((ca) => ca.applicationId === applicationId)) : customers,
    [customers, applicationId]);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description ?? '');
      setStatus(editing.status);
      setOwnerId(editing.ownerId ?? '');
      setApplicationId(editing.applicationId ?? '');
      setCustomerId(editing.customerId ?? '');
      setTargetDate(editing.targetDate ?? '');
    } else {
      setTitle(''); setDescription(''); setStatus('DRAFT');
      setOwnerId(''); setApplicationId(''); setCustomerId(''); setTargetDate('');
    }
  }, [editing, open]);

  useEffect(() => {
    if (customerId && applicationId && !filteredCustomers.some((c) => c.id === customerId)) setCustomerId('');
  }, [applicationId, filteredCustomers, customerId]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const base = {
        title: title.trim(),
        description: description.trim() || null,
        ownerId: ownerId || null,
        applicationId: applicationId || null,
        customerId: customerId || null,
        targetDate: targetDate || null,
      };
      await onSubmit(editing ? { ...base, status } : base);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edit Epic' : 'New Epic'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" required />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={3} size="small" />

          <FormControl size="small" fullWidth>
            <InputLabel>Owner</InputLabel>
            <Select value={ownerId} label="Owner" onChange={(e) => setOwnerId(e.target.value)}>
              <MenuItem value=""><em>None</em></MenuItem>
              {employees.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Application</InputLabel>
            <Select value={applicationId} label="Application" onChange={(e) => { setApplicationId(e.target.value); setCustomerId(''); }}>
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

          <TextField label="Target Date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />

          {editing && (
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as Epic['status'])}>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !title.trim()}>
          {saving ? 'Saving…' : editing ? 'Save' : 'Create Epic'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EpicFormDialog;
