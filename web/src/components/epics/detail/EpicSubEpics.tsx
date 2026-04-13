import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Chip, LinearProgress,
  Tooltip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Autocomplete, TextField,
} from '@mui/material';
import { Add, OpenInNew, AccountTree, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { epicsApi } from '../api/epics';
import EpicStatusChip from '../components/EpicStatusChip';
import EpicPriorityChip from '../components/EpicPriorityChip';
import type { Epic } from '../../../services/api/types';

interface Props {
  epicId: string;
  subEpics: Epic[];
  isAdmin: boolean;
}

const EpicSubEpics: React.FC<Props> = ({ epicId, subEpics, isAdmin }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [linkOpen, setLinkOpen] = useState(false);
  const [selected, setSelected] = useState<Epic | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (linkOpen) setTimeout(() => firstFieldRef.current?.focus(), 100);
  }, [linkOpen]);

  // All epics for the picker (exclude self, current children, and ancestors to prevent cycles)
  const { data: allEpics = [] } = useQuery({
    queryKey: ['epics'],
    queryFn: () => epicsApi.list(),
    staleTime: 30_000,
  });

  const linkMutation = useMutation({
    mutationFn: (childId: string) => epicsApi.update(childId, { parentEpicId: epicId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epics', epicId] });
      qc.invalidateQueries({ queryKey: ['epics'] });
      setLinkOpen(false);
      setSelected(null);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (childId: string) => epicsApi.update(childId, { parentEpicId: null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epics', epicId] });
      qc.invalidateQueries({ queryKey: ['epics'] });
    },
  });

  const subEpicIds = new Set(subEpics.map((s) => s.id));
  const candidates = allEpics.filter(
    (e) => e.id !== epicId && !subEpicIds.has(e.id) && e.parentEpicId !== epicId
  );

  // Roll-up progress from sub-epics
  const totalSteps = subEpics.reduce((s, e) => s + e.stepsTotal, 0);
  const doneSteps  = subEpics.reduce((s, e) => s + e.stepsDone, 0);
  const rollupPct  = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : null;

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <AccountTree sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight={700}>Sub-Epics</Typography>
          <Chip label={subEpics.length} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {rollupPct !== null && (
            <Tooltip title={`Roll-up progress: ${doneSteps}/${totalSteps} steps across all sub-epics`}>
              <Chip label={`${rollupPct}% overall`} size="small" color={rollupPct === 100 ? 'success' : 'default'} />
            </Tooltip>
          )}
          {isAdmin && (
            <Button size="small" startIcon={<Add />} variant="outlined" onClick={() => setLinkOpen(true)}>
              Add Sub-Epic
            </Button>
          )}
        </Box>
      </Box>

      {/* Roll-up progress bar */}
      {rollupPct !== null && (
        <Box mb={2}>
          <LinearProgress
            variant="determinate"
            value={rollupPct}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}

      {subEpics.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No sub-epics yet.</Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={1}>
          {subEpics.map((sub) => {
            const pct = sub.stepsTotal > 0 ? Math.round((sub.stepsDone / sub.stepsTotal) * 100) : 0;
            return (
              <Box
                key={sub.id}
                sx={{
                  p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                <AccountTree sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.25}>
                    <Typography
                      variant="body2" fontWeight={600} noWrap
                      sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                      onClick={() => navigate(`/epics/${sub.id}`)}
                    >
                      {sub.title}
                    </Typography>
                    <EpicPriorityChip priority={sub.priority} />
                    <EpicStatusChip status={sub.status} />
                  </Box>
                  {sub.stepsTotal > 0 && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ flex: 1, height: 4, borderRadius: 2 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {pct}%
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box display="flex" gap={0.5} flexShrink={0}>
                  <Tooltip title="Open">
                    <IconButton size="small" onClick={() => navigate(`/epics/${sub.id}`)}>
                      <OpenInNew sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  {isAdmin && (
                    <Tooltip title="Remove from sub-epics">
                      <IconButton size="small" color="error" onClick={() => unlinkMutation.mutate(sub.id)}>
                        <Close sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Link sub-epic dialog */}
      <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} maxWidth="sm" fullWidth disableScrollLock>
        <DialogTitle>Add Sub-Epic</DialogTitle>
        <DialogContent>
          <Autocomplete
            sx={{ mt: 1 }}
            options={candidates}
            getOptionLabel={(e) => e.title}
            value={selected}
            onChange={(_, v) => setSelected(v)}
            renderInput={(params) => (
              <TextField {...params} inputRef={firstFieldRef} label="Select epic" placeholder="Search epics…" />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body2">{option.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.status} · {option.priority}</Typography>
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selected || linkMutation.isPending}
            onClick={() => selected && linkMutation.mutate(selected.id)}
          >
            {linkMutation.isPending ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EpicSubEpics;
