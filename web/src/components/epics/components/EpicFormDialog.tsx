import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Chip, Box, Autocomplete, Divider, Typography, Collapse,
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
import AppTextField from '../../common/inputs/AppTextField';
import { AppSelect } from '../../common/inputs/AppSelect';
import type { EpicTemplate } from '../api/epicTemplates';
import type { Epic, CreateEpicData, UpdateEpicData } from '../../../services/api/types';
import { getPickerDateFormat } from '../../../stores/tenantStore';

const PRIORITY_OPTIONS = [
  { value: 'LOW',      label: 'Low',      color: '#10b981' },
  { value: 'MEDIUM',   label: 'Medium',   color: '#f59e0b' },
  { value: 'HIGH',     label: 'High',     color: '#ef4444' },
  { value: 'CRITICAL', label: 'Critical', color: '#dc2626' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT',     label: 'Draft'     },
  { value: 'ACTIVE',    label: 'Active'    },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface Props {
  open: boolean;
  editing: Epic | null;
  onClose: () => void;
  onSubmit: (data: CreateEpicData | UpdateEpicData, templateId?: string) => Promise<void>;
}

const EpicFormDialog: React.FC<Props> = ({ open, editing, onClose, onSubmit }) => {
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [status, setStatus]             = useState<Epic['status']>('DRAFT');
  const [ownerId, setOwnerId]           = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [customerId, setCustomerId]     = useState('');
  const [targetDate, setTargetDate]     = useState<Dayjs | null>(null);
  const [priority, setPriority]         = useState<Epic['priority']>('MEDIUM');
  const [tags, setTags]                 = useState<string[]>([]);
  const [tagInput, setTagInput]         = useState('');
  const [estimatedDays, setEstimatedDays] = useState<string>('');
  const [parentEpicId, setParentEpicId] = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EpicTemplate | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const { data: allEpics = [] }    = useQuery({ queryKey: ['epics'],        queryFn: () => epicsApi.list(),                    enabled: open });
  const { data: applications = [], isLoading: appsLoading }    = useQuery({ queryKey: ['applications'], queryFn: () => applicationsApi.getApplications(), enabled: open });
  const { data: customers = [],    isLoading: customersLoading } = useQuery({ queryKey: ['customers'],    queryFn: () => customersApi.getCustomers(),       enabled: open });
  const { data: employees = [],    isLoading: employeesLoading } = useQuery({ queryKey: ['employees'],    queryFn: () => usersApi.getEmployees(),            enabled: open });

  const filteredCustomers = useMemo(() =>
    applicationId ? customers.filter((c) => c.applications?.some((ca) => ca.applicationId === applicationId)) : customers,
    [customers, applicationId]);

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100);
  }, [open]);

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
      setOwnerId(''); setApplicationId(''); setCustomerId('');
      setTargetDate(null); setPriority('MEDIUM'); setTags([]);
      setEstimatedDays(''); setParentEpicId(null);
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

            {/* Title */}
            <AppTextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth size="small" required
              inputRef={titleRef}
              maxLength={120}
            />

            {/* Description */}
            <AppTextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth multiline minRows={3} size="small"
              maxLength={500}
            />

            {/* Template picker — new epics only */}
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
                        <Chip label={selectedTemplate.name} size="small" color="primary"
                          onDelete={(e) => { e.stopPropagation(); setSelectedTemplate(null); }} />
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

            {/* Priority — with color dots */}
            <AppSelect
              label="Priority"
              value={priority}
              onChange={(v) => setPriority(v as Epic['priority'])}
              options={PRIORITY_OPTIONS}
            />

            {/* Owner */}
            <AppSelect
              label="Owner"
              value={ownerId}
              onChange={setOwnerId}
              placeholder="None"
              showClearButton
              onClear={() => setOwnerId('')}
              loading={employeesLoading}
              options={employees.map((u) => ({ value: u.id, label: u.name }))}
              required
            />

            {/* Application */}
            <AppSelect
              label="Application"
              value={applicationId}
              onChange={(v) => { setApplicationId(v); setCustomerId(''); }}
              placeholder="None"
              showClearButton
              onClear={() => { setApplicationId(''); setCustomerId(''); }}
              loading={appsLoading}
              options={applications.map((a) => ({ value: a.id, label: a.name }))}
            />

            {/* Customer — filtered by application */}
            <AppSelect
              label="Customer"
              value={customerId}
              onChange={setCustomerId}
              placeholder="None"
              showClearButton
              onClear={() => setCustomerId('')}
              loading={customersLoading}
              options={filteredCustomers.map((c) => ({ value: c.id, label: c.name }))}
            />

            {/* Target date */}
            <DatePicker
              label="Target Date"
              value={targetDate}
              onChange={(val) => setTargetDate(val as Dayjs | null)}
              format={getPickerDateFormat()}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />

            {/* Estimated days */}
            <AppTextField
              fieldType="number"
              label="Estimated Days"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value.replace(/[^0-9]/g, ''))}
              size="small" fullWidth min={1}
              placeholder="e.g. 14"
              helperText="How many working days is this epic expected to take?"
            />

            {/* Parent epic */}
            <Autocomplete
              size="small"
              options={allEpics.filter((e) => e.id !== editing?.id)}
              getOptionLabel={(e) => e.title}
              value={allEpics.find((e) => e.id === parentEpicId) ?? null}
              onChange={(_, v) => setParentEpicId(v?.id ?? null)}
              renderInput={(params) => (
                <AppTextField {...params} label="Parent Epic (optional)" placeholder="Search epics…" size="small" />
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

            {/* Tags */}
            <Box>
              <AppTextField
                size="small" fullWidth label="Tags"
                placeholder="Type a tag and press Enter or comma"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                showClearButton={false}
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

            {/* Status — edit only */}
            {editing && (
              <AppSelect
                label="Status"
                value={status}
                onChange={(v) => setStatus(v as Epic['status'])}
                options={STATUS_OPTIONS}
              />
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
