import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip,
  IconButton, Tooltip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Stack, LinearProgress, Alert, Snackbar,
} from '@mui/material';
import {
  ArrowBack, Add, Edit, Delete, CheckCircle, RadioButtonUnchecked,
  Person, Code, Apps, Group, ConfirmationNumber, OpenInNew,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featuresApi } from './api/features';
import { usersApi } from '../admin/usersManagement/api/users';
import { ticketsApi } from '../admin/ticketsManagement/api/tickets';
import FeatureStatusChip from './components/FeatureStatusChip';
import type { FeatureStep, CreateStepData, UpdateStepData } from '../../services/api/types';

const STEP_STATUS_COLOR: Record<FeatureStep['status'], 'default' | 'warning' | 'success'> = {
  TODO: 'default', IN_PROGRESS: 'warning', DONE: 'success',
};

// ── Step Form Dialog ──────────────────────────────────────────────────────────
interface StepDialogProps {
  open: boolean;
  editing: FeatureStep | null;
  employees: { id: string; name: string }[];
  programmers: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (data: CreateStepData | UpdateStepData) => Promise<void>;
}

const StepDialog: React.FC<StepDialogProps> = ({ open, editing, employees, programmers, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [assignedProgrammerId, setAssignedProgrammerId] = useState('');
  const [status, setStatus] = useState<FeatureStep['status']>('TODO');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description ?? '');
      setAssignedToId(editing.assignedToId ?? '');
      setAssignedProgrammerId(editing.assignedProgrammerId ?? '');
      setStatus(editing.status);
    } else {
      setTitle(''); setDescription(''); setAssignedToId(''); setAssignedProgrammerId(''); setStatus('TODO');
    }
  }, [editing, open]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        assignedToId: assignedToId || null,
        assignedProgrammerId: assignedProgrammerId || null,
        ...(editing ? { status } : {}),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edit Step' : 'Add Step'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Step Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" required />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={3} size="small" />
          <FormControl size="small" fullWidth>
            <InputLabel>Assign to Employee</InputLabel>
            <Select value={assignedToId} label="Assign to Employee" onChange={(e) => setAssignedToId(e.target.value)}>
              <MenuItem value=""><em>None</em></MenuItem>
              {employees.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Assign to Programmer</InputLabel>
            <Select value={assignedProgrammerId} label="Assign to Programmer" onChange={(e) => setAssignedProgrammerId(e.target.value)}>
              <MenuItem value=""><em>None</em></MenuItem>
              {programmers.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
            </Select>
          </FormControl>
          {editing && (
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as FeatureStep['status'])}>
                <MenuItem value="TODO">To Do</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="DONE">Done</MenuItem>
              </Select>
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !title.trim()}>
          {saving ? 'Saving…' : editing ? 'Save' : 'Add Step'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Create Ticket Dialog ──────────────────────────────────────────────────────
interface CreateTicketDialogProps {
  open: boolean;
  step: FeatureStep | null;
  featureTitle: string;
  applicationId?: string | null;
  customerId?: string | null;
  employees: { id: string; name: string }[];
  programmers: { id: string; name: string }[];
  onClose: () => void;
  onCreated: (stepId: string, ticketId: string) => Promise<void>;
}

const CreateTicketDialog: React.FC<CreateTicketDialogProps> = ({
  open, step, featureTitle, applicationId, customerId,
  employees, programmers, onClose, onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const allAssignees = [
    ...employees.map((u) => ({ ...u, label: `${u.name} (Employee)` })),
    ...programmers.map((u) => ({ ...u, label: `${u.name} (Programmer)` })),
  ];

  React.useEffect(() => {
    if (step && open) {
      setTitle(`[${featureTitle}] ${step.title}`);
      setDescription(step.description ?? '');
      // Pre-select assignee if step already has one
      setAssignedToId(step.assignedToId ?? step.assignedProgrammerId ?? '');
      setPriority('MEDIUM');
      setDueDate('');
    }
  }, [step, open, featureTitle]);

  const handleSubmit = async () => {
    if (!title.trim() || !step) return;
    setSaving(true);
    try {
      const ticket = await ticketsApi.createTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedToId: assignedToId || undefined,
        applicationId: applicationId ?? undefined,
        customerId: customerId ?? undefined,
        dueDate: dueDate || undefined,
      });
      await onCreated(step.id, ticket.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ConfirmationNumber fontSize="small" color="primary" />
        Create Ticket for Step
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {step && (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary">Step</Typography>
              <Typography variant="body2" fontWeight={600}>{step.title}</Typography>
            </Paper>
          )}

          <TextField
            label="Ticket Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth size="small" required
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth multiline minRows={3} size="small"
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value as typeof priority)}>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="URGENT">Urgent</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Assign To</InputLabel>
            <Select value={assignedToId} label="Assign To" onChange={(e) => setAssignedToId(e.target.value)}>
              <MenuItem value=""><em>Unassigned</em></MenuItem>
              {allAssignees.map((u) => <MenuItem key={u.id} value={u.id}>{u.label}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            fullWidth size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || !title.trim()}
          startIcon={<ConfirmationNumber />}
        >
          {saving ? 'Creating…' : 'Create & Link Ticket'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const FeatureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const backPath: string = (location.state as { from?: string })?.from ?? '/features';

  const [stepDialog, setStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<FeatureStep | null>(null);
  const [ticketDialog, setTicketDialog] = useState(false);
  const [ticketStep, setTicketStep] = useState<FeatureStep | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const { data: feature, isLoading: featureLoading } = useQuery({
    queryKey: ['features', id],
    queryFn: () => featuresApi.getOne(id!),
    enabled: !!id,
  });

  const { data: steps = [], isLoading: stepsLoading } = useQuery({
    queryKey: ['features', id, 'steps'],
    queryFn: () => featuresApi.listSteps(id!),
    enabled: !!id,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.getEmployees(),
  });

  const { data: programmers = [] } = useQuery({
    queryKey: ['programmers'],
    queryFn: () => usersApi.getProgrammers(),
  });

  const invalidateSteps = () => {
    qc.invalidateQueries({ queryKey: ['features', id, 'steps'] });
    qc.invalidateQueries({ queryKey: ['features', id] });
    qc.invalidateQueries({ queryKey: ['features'] });
    qc.invalidateQueries({ queryKey: ['epics'] });
  };

  const createStepMutation = useMutation({
    mutationFn: (data: CreateStepData) => featuresApi.createStep(id!, data),
    onSuccess: () => { invalidateSteps(); setSnack({ msg: 'Step added', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to add step', severity: 'error' }),
  });

  const updateStepMutation = useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: UpdateStepData }) =>
      featuresApi.updateStep(id!, stepId, data),
    onSuccess: () => { invalidateSteps(); setSnack({ msg: 'Step updated', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to update step', severity: 'error' }),
  });

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: string) => featuresApi.deleteStep(id!, stepId),
    onSuccess: () => { invalidateSteps(); setSnack({ msg: 'Step deleted', severity: 'success' }); },
    onError: () => setSnack({ msg: 'Failed to delete step', severity: 'error' }),
  });

  const toggleStepDone = (step: FeatureStep) => {
    const next: FeatureStep['status'] = step.status === 'DONE' ? 'TODO' : 'DONE';
    updateStepMutation.mutate({ stepId: step.id, data: { status: next } });
  };

  const handleStepSubmit = async (data: CreateStepData | UpdateStepData) => {
    if (editingStep) {
      await updateStepMutation.mutateAsync({ stepId: editingStep.id, data: data as UpdateStepData });
    } else {
      await createStepMutation.mutateAsync(data as CreateStepData);
    }
  };

  // After ticket is created, link it to the step
  const handleTicketCreated = async (stepId: string, ticketId: string) => {
    await updateStepMutation.mutateAsync({ stepId, data: { linkedTicketId: ticketId } });
    qc.invalidateQueries({ queryKey: ['tickets'] });
    setSnack({ msg: 'Ticket created and linked to step!', severity: 'success' });
  };

  const unlinkTicket = (step: FeatureStep) => {
    updateStepMutation.mutate({ stepId: step.id, data: { linkedTicketId: null } });
  };

  const doneCount = steps.filter((s) => s.status === 'DONE').length;
  const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  if (featureLoading) return <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>;
  if (!feature) return <Box p={4}><Alert severity="error">Feature not found</Alert></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(backPath)} sx={{ mb: 1 }}>
        Back
      </Button>

      {/* Breadcrumb — fix #6 */}
      {backPath.startsWith('/epics/') && feature && (
        <Box display="flex" alignItems="center" gap={0.5} mb={2}>
          <Typography
            variant="caption" color="primary" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => navigate('/epics')}
          >
            Epics
          </Typography>
          <Typography variant="caption" color="text.secondary">›</Typography>
          <Typography
            variant="caption" color="primary" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => navigate(backPath)}
          >
            {feature.epicTitle ?? 'Epic'}
          </Typography>
          <Typography variant="caption" color="text.secondary">›</Typography>
          <Typography variant="caption" color="text.secondary">{feature.title}</Typography>
        </Box>
      )}

      {/* Feature Header */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
              <Typography variant="h5" fontWeight={700}>{feature.title}</Typography>
              <FeatureStatusChip status={feature.status} />
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {feature.description}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {feature.applicationName && (
                <Chip icon={<Apps fontSize="small" />} label={feature.applicationName} size="small" variant="outlined" />
              )}
              {feature.customerName && (
                <Chip icon={<Person fontSize="small" />} label={feature.customerName} size="small" variant="outlined" color="secondary" />
              )}
              <Chip icon={<Group fontSize="small" />} label={`${feature.voteCount} vote${feature.voteCount !== 1 ? 's' : ''}`} size="small" />
            </Box>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">
              Submitted by {feature.submittedBy.name}
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              {new Date(feature.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Steps Section */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Implementation Steps</Typography>
          {steps.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {doneCount}/{steps.length} done · {progress}%
            </Typography>
          )}
        </Box>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => { setEditingStep(null); setStepDialog(true); }}>
          Add Step
        </Button>
      </Box>

      {steps.length > 0 && (
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 2, borderRadius: 1, height: 6 }} />
      )}

      {stepsLoading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
      ) : steps.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Typography color="text.secondary">No steps yet. Break this feature into implementation steps.</Typography>
        </Paper>
      ) : (
        steps.map((step, idx) => (
          <Paper
            key={step.id}
            sx={{
              mb: 1.5, p: 2, borderRadius: 2,
              border: '1px solid',
              borderColor: step.status === 'DONE' ? 'success.main' : 'divider',
              opacity: step.status === 'DONE' ? 0.75 : 1,
            }}
          >
            <Box display="flex" alignItems="flex-start" gap={1.5}>
              <Tooltip title={step.status === 'DONE' ? 'Mark incomplete' : 'Mark done'}>
                <IconButton size="small" onClick={() => toggleStepDone(step)} sx={{ mt: 0.25 }}>
                  {step.status === 'DONE'
                    ? <CheckCircle color="success" fontSize="small" />
                    : <RadioButtonUnchecked fontSize="small" />}
                </IconButton>
              </Tooltip>

              <Box flex={1} minWidth={0}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>#{idx + 1}</Typography>
                  <Typography
                    variant="subtitle2" fontWeight={600} sx={{ flex: 1,
                      textDecoration: step.status === 'DONE' ? 'line-through' : 'none',
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Chip label={step.status.replace('_', ' ')} size="small" color={STEP_STATUS_COLOR[step.status]} />
                </Box>

                {step.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 3 }}>
                    {step.description}
                  </Typography>
                )}

                {/* Assignments + Ticket */}
                <Box display="flex" gap={1} mt={1} ml={3} flexWrap="wrap" alignItems="center">
                  {step.assignedTo && (
                    <Chip icon={<Person fontSize="small" />} label={step.assignedTo.name} size="small" variant="outlined" color="primary" />
                  )}
                  {step.assignedProgrammer && (
                    <Chip icon={<Code fontSize="small" />} label={step.assignedProgrammer.name} size="small" variant="outlined" color="secondary" />
                  )}

                  {step.linkedTicket ? (
                    <>
                      <Chip
                        icon={<ConfirmationNumber fontSize="small" />}
                        label={step.linkedTicket.title}
                        size="small"
                        color="info"
                        onClick={() => navigate(`/tickets/${step.linkedTicketId}`)}
                        onDelete={() => unlinkTicket(step)}
                        sx={{ cursor: 'pointer', maxWidth: 220 }}
                      />
                      <Tooltip title="Open ticket">
                        <IconButton size="small" onClick={() => navigate(`/tickets/${step.linkedTicketId}`)}>
                          <OpenInNew sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Tooltip title="Create a ticket for this step">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ConfirmationNumber fontSize="small" />}
                        onClick={() => { setTicketStep(step); setTicketDialog(true); }}
                        sx={{ height: 24, fontSize: '0.7rem', py: 0 }}
                      >
                        Create Ticket
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Actions */}
              <Box display="flex" gap={0.5}>
                <Tooltip title="Edit step">
                  <IconButton size="small" onClick={() => { setEditingStep(step); setStepDialog(true); }}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete step">
                  <IconButton size="small" color="error" onClick={() => deleteStepMutation.mutate(step.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        ))
      )}

      <StepDialog
        open={stepDialog}
        editing={editingStep}
        employees={employees}
        programmers={programmers}
        onClose={() => setStepDialog(false)}
        onSubmit={handleStepSubmit}
      />

      <CreateTicketDialog
        open={ticketDialog}
        step={ticketStep}
        featureTitle={feature.title}
        applicationId={feature.applicationId}
        customerId={feature.customerId}
        employees={employees}
        programmers={programmers}
        onClose={() => setTicketDialog(false)}
        onCreated={handleTicketCreated}
      />

      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FeatureDetailPage;
