import React, { useRef, useEffect, useState } from 'react';
import {
  Box, Typography, Chip, Avatar, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  Autocomplete, TextField, CircularProgress,
} from '@mui/material';
import { Add, Close, Edit, Group } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { epicsApi, type EpicContributor } from '../api/epics';
import { usersApi } from '../../admin/usersManagement/api/users';

const ROLES = ['PM', 'TECH_LEAD', 'DESIGNER', 'DEVELOPER', 'QA', 'DEVOPS', 'ANALYST', 'STAKEHOLDER', 'OTHER'] as const;

const ROLE_COLORS: Record<string, string> = {
  PM: '#7c3aed', TECH_LEAD: '#1976d2', DESIGNER: '#e91e63',
  DEVELOPER: '#0288d1', QA: '#388e3c', DEVOPS: '#f57c00',
  ANALYST: '#0097a7', STAKEHOLDER: '#5d4037', OTHER: '#757575',
};

const ROLE_LABELS: Record<string, string> = {
  PM: 'PM', TECH_LEAD: 'Tech Lead', DESIGNER: 'Designer',
  DEVELOPER: 'Developer', QA: 'QA', DEVOPS: 'DevOps',
  ANALYST: 'Analyst', STAKEHOLDER: 'Stakeholder', OTHER: 'Other',
};

const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

interface Props {
  epicId: string;
  isAdmin: boolean;
}

const EpicContributors: React.FC<Props> = ({ epicId, isAdmin }) => {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EpicContributor | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [role, setRole] = useState<string>('DEVELOPER');
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addOpen || editTarget) setTimeout(() => firstFieldRef.current?.focus(), 100);
  }, [addOpen, editTarget]);

  const { data: contributors = [], isLoading } = useQuery({
    queryKey: ['epics', epicId, 'contributors'],
    queryFn: () => epicsApi.listContributors(epicId),
    staleTime: 30_000,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.getEmployees(),
    enabled: addOpen,
    staleTime: 60_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['epics', epicId, 'contributors'] });

  const addMutation = useMutation({
    mutationFn: () => epicsApi.addContributor(epicId, selectedUser!.id, role),
    onSuccess: () => { invalidate(); setAddOpen(false); setSelectedUser(null); setRole('DEVELOPER'); },
  });

  const updateMutation = useMutation({
    mutationFn: () => epicsApi.updateContributor(epicId, editTarget!.id, role),
    onSuccess: () => { invalidate(); setEditTarget(null); },
  });

  const removeMutation = useMutation({
    mutationFn: (contributorId: string) => epicsApi.removeContributor(epicId, contributorId),
    onSuccess: invalidate,
  });

  const existingUserIds = new Set(contributors.map((c) => c.user.id));
  const availableUsers = employees.filter((e) => !existingUserIds.has(e.id));

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={0.75} mb={1}>
        <Group sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
          Contributors
        </Typography>
        {isAdmin && (
          <IconButton size="small" onClick={() => setAddOpen(true)} sx={{ ml: 'auto', p: 0.25 }}>
            <Add sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      {isLoading ? (
        <CircularProgress size={16} />
      ) : contributors.length === 0 ? (
        <Typography variant="caption" color="text.disabled">No contributors assigned</Typography>
      ) : (
        <Box display="flex" gap={0.75} flexWrap="wrap">
          {contributors.map((c) => (
            <Tooltip
              key={c.id}
              title={
                <Box>
                  <Typography variant="caption" fontWeight={700}>{c.user.name}</Typography>
                  <Typography variant="caption" display="block" color="text.secondary">{c.user.email}</Typography>
                  <Typography variant="caption" display="block">{ROLE_LABELS[c.role] ?? c.role}</Typography>
                </Box>
              }
            >
              <Chip
                avatar={
                  <Avatar sx={{ bgcolor: ROLE_COLORS[c.role] ?? '#757575', fontSize: '0.55rem', width: 20, height: 20 }}>
                    {initials(c.user.name)}
                  </Avatar>
                }
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <span>{c.user.name.split(' ')[0]}</span>
                    <Box component="span" sx={{ fontSize: '0.6rem', opacity: 0.75,
                      bgcolor: `${ROLE_COLORS[c.role] ?? '#757575'}22`,
                      color: ROLE_COLORS[c.role] ?? '#757575',
                      px: 0.5, borderRadius: 0.5 }}>
                      {ROLE_LABELS[c.role] ?? c.role}
                    </Box>
                  </Box>
                }
                size="small"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.72rem', borderColor: `${ROLE_COLORS[c.role] ?? '#757575'}44` }}
                onClick={isAdmin ? () => { setEditTarget(c); setRole(c.role); } : undefined}
                onDelete={isAdmin ? () => removeMutation.mutate(c.id) : undefined}
                deleteIcon={<Close sx={{ fontSize: '0.8rem !important' }} />}
              />
            </Tooltip>
          ))}
        </Box>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Contributor</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Autocomplete
              size="small"
              options={availableUsers}
              getOptionLabel={(u) => `${u.name} (${u.email})`}
              value={selectedUser}
              onChange={(_, v) => setSelectedUser(v)}
              renderInput={(params) => (
                <TextField {...params} label="User" inputRef={firstFieldRef} />
              )}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ROLE_COLORS[r], flexShrink: 0 }} />
                      {ROLE_LABELS[r]}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!selectedUser || addMutation.isPending}
            onClick={() => addMutation.mutate()}>
            {addMutation.isPending ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit role dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Edit fontSize="small" />
            Change Role — {editTarget?.user.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <FormControl size="small" fullWidth sx={{ mt: 1 }}>
            <InputLabel>Role</InputLabel>
            <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}
              inputRef={firstFieldRef}>
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ROLE_COLORS[r], flexShrink: 0 }} />
                    {ROLE_LABELS[r]}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button variant="contained" disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}>
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EpicContributors;
