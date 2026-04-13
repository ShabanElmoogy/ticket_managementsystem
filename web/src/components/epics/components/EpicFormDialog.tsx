import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem, Stack,
  Chip, Box, Autocomplete, Divider, Typography, Collapse,
} from '@mui/material';
import { LibraryBooks, ExpandMore, ExpandLess } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '../../admin/applicationsManagement/api/applications';
import { customersApi } from '../../admin/customersManagement/api/customers';
import { usersApi } from '../../admin/usersManagement/api/users';
import { epicsApi } from '../api/epics';
import TemplatePicker from './TemplatePicker';
import type { EpicTemplate } from '../api/epicTemplates';
import type { Epic, CreateEpicData, UpdateEpicData } from '../../../services/api/types';

const STATUSES: Epic['status'][] = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const PRIORITIES: Epic['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

interface Props {
  open: boolean;
  editing: Epic | null;
  onClose: () => void;
  onSubmit: (data: CreateEpicData | UpdateEpicData, templateId?: string) => Promise<void>;
}

const EpicFormDialog: React.FC<Props> = ({ open, editing, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Epic['status']>('DRAFT');
  const [ownerId, setOwnerId] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [targetDate, setTargetDate] = useState<Dayjs | null>(null);
  const [priority, setPriority] = useState<Epic['priority']>('MEDIUM');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [estimatedDays, setEstimatedDays] = useState<string>('');
  const [parentEpicId, setParentEpicId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EpicTemplate | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);

  const { data: allEpics = [] } = useQuery({ queryKey: ['epics'], queryFn: () => epicsApi.list(), enabled: open });

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100);
  }, [open]);

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
      setTargetDate(editing.targetDate ? dayjs(editing.targetDate) : null);
      setPriority(editing.priority ?? 'MEDIUM');
      setTags(editing.tags ?? []);
      setEstimatedDays(editing.estimatedDays != null ? String(editing.estimatedDays) : '');
      setParentEpicId(editing.parentEpicId ?? null);
    } else {
      setTitle(''); setDescription(''); setStatus('DRAFT');
      setOwnerId(''); setApplicationId(''); setCustomerId(''); setTargetDate(null); setPriority('MEDIUM'); setTags([]); setEstimatedDays(''); setParentEpicId(null);
      setSelectedTemplate(null); setTemplateOpen(false);
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
        priority,
        tags,
        ownerId: ownerId || null,
        applicationId: applicationId || null,
        customerId: customerId || null,
        targetDate: targetDate ? targetDate.format('YYYY-MM-DD') : null,
        estimatedDays: estimatedDays ? parseInt(estimatedDays, 10) : null,
        parentEpicId: parentEpicId || null,
      };
      await onSubmit(editing ? { ...base, status } : base, selectedTemplate?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableScrollLock>
      <DialogTitle>{editing ? 'Edit Epic' : 'New Epic'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" required inputRef={titleRef} />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={3} size="small" />

          {/* Template picker — only for new epics */}
          {!editing && (
            <>
              <Divider />
              <Box>
                <Box
                  display="flex" alignItems="center" justifyContent="space-between"
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setTemplateOpen((v) => !v)}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <LibraryBooks fontSize="small" color="primary" />
                    <Typography variant="subtitle2" fontWeight={700}>Start from a Template</Typography>
                    {selectedTemplate && (
                      <Chip label={selectedTemplate.name} size="small" color="primary" onDelete={(e) => { e.stopPropagation(); setSelectedTemplate(null); }} />
                    )}
                  </Box>
                  {templateOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </Box>
                <Collapse in={templateOpen}>
                  <Box mt={1.5}>
                    <TemplatePicker
                      selected={selectedTemplate}
                      onSelect={(t) => {
                        setSelectedTemplate(t);
                        if (t) {
                          if (!title.trim()) setTitle(t.name);
                          if (!description.trim() && t.description) setDescription(t.description);
                        }
                      }}
                    />
                  </Box>
                </Collapse>
              </Box>
              <Divider />
            </>
          )}

          <FormControl size="small" fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value as Epic['priority'])}>
              {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>

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

          <DatePicker
            label="Target Date"
            value={targetDate}
            onChange={(val) => setTargetDate(val as Dayjs | null)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />

          <TextField
            label="Estimated Days"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value.replace(/[^0-9]/g, ''))}
            size="small"
            fullWidth
            type="number"
            slotProps={{ htmlInput: { min: 1 } }}
            placeholder="e.g. 14"
            helperText="How many working days is this epic expected to take?"
          />

          <Autocomplete
            size="small"
            options={allEpics.filter((e) => e.id !== editing?.id)}
            getOptionLabel={(e) => e.title}
            value={allEpics.find((e) => e.id === parentEpicId) ?? null}
            onChange={(_, v) => setParentEpicId(v?.id ?? null)}
            renderInput={(params) => (
              <TextField {...params} label="Parent Epic (optional)" placeholder="Search epics…" size="small" />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <span>{option.title}</span>
                  <Box component="span" sx={{ ml: 1, fontSize: '0.7rem', color: 'text.secondary' }}>
                    {option.status}
                  </Box>
                </Box>
              </li>
            )}
          />

          <Box>
            <TextField
              size="small" fullWidth label="Tags"
              placeholder="Type a tag and press Enter or comma"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const t = tagInput.trim().replace(/,$/, '');
                  if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
                  setTagInput('');
                } else if (e.key === 'Backspace' && !tagInput && tags.length) {
                  setTags((prev) => prev.slice(0, -1));
                }
              }}
            />
            {tags.length > 0 && (
              <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                {tags.map((t) => (
                  <Chip key={t} label={t} size="small" onDelete={() => setTags((prev) => prev.filter((x) => x !== t))} />
                ))}
              </Box>
            )}
          </Box>

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
    </LocalizationProvider>
  );
};

export default EpicFormDialog;
