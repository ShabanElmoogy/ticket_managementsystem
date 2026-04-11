import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Add, OpenInNew, Close, Link as LinkIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { epicsApi } from '../api/epics';
import EpicStatusChip from '../components/EpicStatusChip';
import type { Epic, EpicRelation, EpicRelationType } from '../../../services/api/types';

const RELATION_CONFIG: Record<EpicRelationType, { label: string; color: string }> = {
  RELATES_TO:  { label: 'Relates to',  color: '#1976d2' },
  DUPLICATES:  { label: 'Duplicates',  color: '#9c27b0' },
  DEPENDS_ON:  { label: 'Depends on',  color: '#f57c00' },
  SPLIT_FROM:  { label: 'Split from',  color: '#0288d1' },
};

const DIRECTION_INVERSE: Record<EpicRelationType, string> = {
  RELATES_TO:  'Relates to',
  DUPLICATES:  'Duplicated by',
  DEPENDS_ON:  'Required by',
  SPLIT_FROM:  'Split into',
};

interface Props {
  epicId: string;
  isAdmin: boolean;
}

const EpicRelations: React.FC<Props> = ({ epicId, isAdmin }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [relationType, setRelationType] = useState<EpicRelationType>('RELATES_TO');
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => firstFieldRef.current?.focus(), 100);
  }, [open]);

  const { data: relations = [] } = useQuery({
    queryKey: ['epics', epicId, 'relations'],
    queryFn: () => epicsApi.listRelations(epicId),
    staleTime: 30_000,
  });

  const { data: allEpics = [] } = useQuery({
    queryKey: ['epics'],
    queryFn: () => epicsApi.list(),
    staleTime: 30_000,
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: () => epicsApi.addRelation(epicId, selectedEpic!.id, relationType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epics', epicId, 'relations'] });
      setOpen(false);
      setSelectedEpic(null);
      setRelationType('RELATES_TO');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (relationId: string) => epicsApi.removeRelation(epicId, relationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epics', epicId, 'relations'] }),
  });

  const existingIds = new Set(relations.map((r) => r.epicId));
  const candidates = allEpics.filter((e) => e.id !== epicId && !existingIds.has(e.id));

  // Group by relation type
  const grouped = relations.reduce<Record<string, EpicRelation[]>>((acc, r) => {
    const key = r.direction === 'outgoing' ? r.relationType : `${r.relationType}_INCOMING`;
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mt: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <LinkIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight={700}>Relations</Typography>
          {relations.length > 0 && (
            <Chip label={relations.length} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
          )}
        </Box>
        {isAdmin && (
          <Button size="small" startIcon={<Add />} variant="outlined" onClick={() => setOpen(true)}>
            Add Relation
          </Button>
        )}
      </Box>

      {relations.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No relations yet.</Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={1}>
          {relations.map((rel) => {
            const cfg = RELATION_CONFIG[rel.relationType];
            const label = rel.direction === 'outgoing'
              ? cfg.label
              : DIRECTION_INVERSE[rel.relationType];
            return (
              <Box
                key={rel.id}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                <Chip
                  label={label}
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: cfg.color, color: '#fff', flexShrink: 0 }}
                />
                <Typography
                  variant="body2" fontWeight={600} noWrap sx={{ flex: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                  onClick={() => navigate(`/epics/${rel.epicId}`)}
                >
                  {rel.title}
                </Typography>
                <EpicStatusChip status={rel.status} />
                <Tooltip title="Open">
                  <IconButton size="small" onClick={() => navigate(`/epics/${rel.epicId}`)}>
                    <OpenInNew sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                {isAdmin && (
                  <Tooltip title="Remove relation">
                    <IconButton size="small" color="error" onClick={() => removeMutation.mutate(rel.id)}>
                      <Close sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Add relation dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Relation</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl size="small" fullWidth>
              <InputLabel>Relation type</InputLabel>
              <Select
                value={relationType}
                label="Relation type"
                onChange={(e) => setRelationType(e.target.value as EpicRelationType)}
              >
                {(Object.entries(RELATION_CONFIG) as [EpicRelationType, { label: string }][]).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Autocomplete
              options={candidates}
              getOptionLabel={(e) => e.title}
              value={selectedEpic}
              onChange={(_, v) => setSelectedEpic(v)}
              renderInput={(params) => (
                <TextField {...params} inputRef={firstFieldRef} label="Select epic" placeholder="Search epics…" size="small" />
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedEpic || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EpicRelations;
