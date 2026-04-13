import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Box, Typography, IconButton,
  Divider, Chip, Tooltip, Collapse,
} from '@mui/material';
import { Add, Delete, ExpandMore, ExpandLess, DragIndicator } from '@mui/icons-material';
import type { EpicTemplate, TemplateFeature, TemplateStep } from '../api/epicTemplates';

interface Props {
  open: boolean;
  editing: EpicTemplate | null;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; category: string; features: TemplateFeature[] }) => Promise<void>;
}

const emptyStep = (): TemplateStep => ({ title: '', description: '' });
const emptyFeature = (): TemplateFeature => ({ title: '', description: '', steps: [] });

const TemplateFormDialog: React.FC<Props> = ({ open, editing, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [features, setFeatures] = useState<TemplateFeature[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? '');
      setCategory(editing.category);
      setFeatures(editing.features.map((f) => ({ ...f, steps: f.steps ?? [] })));
      setExpandedIdx(null);
    } else {
      setName(''); setDescription(''); setCategory('General');
      setFeatures([emptyFeature()]);
      setExpandedIdx(0);
    }
  }, [editing, open]);

  const updateFeature = (i: number, patch: Partial<TemplateFeature>) =>
    setFeatures((prev) => prev.map((f, idx) => idx === i ? { ...f, ...patch } : f));

  const addFeature = () => {
    setFeatures((prev) => [...prev, emptyFeature()]);
    setExpandedIdx(features.length);
  };

  const removeFeature = (i: number) =>
    setFeatures((prev) => prev.filter((_, idx) => idx !== i));

  const addStep = (fi: number) =>
    updateFeature(fi, { steps: [...(features[fi].steps ?? []), emptyStep()] });

  const updateStep = (fi: number, si: number, patch: Partial<TemplateStep>) =>
    updateFeature(fi, {
      steps: (features[fi].steps ?? []).map((s, idx) => idx === si ? { ...s, ...patch } : s),
    });

  const removeStep = (fi: number, si: number) =>
    updateFeature(fi, { steps: (features[fi].steps ?? []).filter((_, idx) => idx !== si) });

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        category: category.trim() || 'General',
        features: features.filter((f) => f.title.trim()).map((f) => ({
          ...f,
          steps: (f.steps ?? []).filter((s) => s.title.trim()),
        })),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableScrollLock>
      <DialogTitle>{editing ? 'Edit Template' : 'New Epic Template'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box display="flex" gap={2}>
            <TextField
              label="Template Name" value={name} onChange={(e) => setName(e.target.value)}
              fullWidth size="small" required inputRef={nameRef}
            />
            <TextField
              label="Category" value={category} onChange={(e) => setCategory(e.target.value)}
              size="small" sx={{ width: 180 }} placeholder="e.g. Web App"
            />
          </Box>
          <TextField
            label="Description" value={description} onChange={(e) => setDescription(e.target.value)}
            fullWidth size="small" multiline minRows={2}
          />

          <Divider />

          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2" fontWeight={700}>
              Features <Chip label={features.length} size="small" sx={{ ml: 0.5 }} />
            </Typography>
            <Button size="small" startIcon={<Add />} onClick={addFeature}>Add Feature</Button>
          </Box>

          {features.map((feat, fi) => (
            <Box key={fi} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              {/* Feature header row */}
              <Box
                display="flex" alignItems="center" gap={1} px={1.5} py={1}
                sx={{ bgcolor: 'action.hover', cursor: 'pointer' }}
                onClick={() => setExpandedIdx(expandedIdx === fi ? null : fi)}
              >
                <DragIndicator fontSize="small" sx={{ color: 'text.disabled' }} />
                <TextField
                  value={feat.title}
                  onChange={(e) => { e.stopPropagation(); updateFeature(fi, { title: e.target.value }); }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={`Feature ${fi + 1} title`}
                  size="small" variant="standard"
                  sx={{ flex: 1, '& .MuiInput-root': { fontSize: 14, fontWeight: 600 } }}
                  slotProps={{ htmlInput: { style: { padding: '2px 0' } } }}
                />
                <Chip label={`${(feat.steps ?? []).length} steps`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                <Tooltip title="Remove feature">
                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); removeFeature(fi); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
                {expandedIdx === fi ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </Box>

              <Collapse in={expandedIdx === fi}>
                <Box px={2} pb={2} pt={1}>
                  <TextField
                    label="Feature description" value={feat.description ?? ''}
                    onChange={(e) => updateFeature(fi, { description: e.target.value })}
                    fullWidth size="small" multiline minRows={2} sx={{ mb: 2 }}
                  />

                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                    STEPS
                  </Typography>

                  <Stack spacing={1}>
                    {(feat.steps ?? []).map((step, si) => (
                      <Box key={si} display="flex" gap={1} alignItems="flex-start">
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, minWidth: 20, textAlign: 'right' }}>
                          {si + 1}.
                        </Typography>
                        <TextField
                          value={step.title} placeholder="Step title"
                          onChange={(e) => updateStep(fi, si, { title: e.target.value })}
                          size="small" sx={{ flex: 1 }}
                        />
                        <TextField
                          value={step.description ?? ''} placeholder="Description (optional)"
                          onChange={(e) => updateStep(fi, si, { description: e.target.value })}
                          size="small" sx={{ flex: 1 }}
                        />
                        <IconButton size="small" color="error" onClick={() => removeStep(fi, si)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>

                  <Button size="small" startIcon={<Add />} onClick={() => addStep(fi)} sx={{ mt: 1 }}>
                    Add Step
                  </Button>
                </Box>
              </Collapse>
            </Box>
          ))}

          {features.length === 0 && (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary">No features yet — add one above</Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : editing ? 'Save Template' : 'Create Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateFormDialog;
