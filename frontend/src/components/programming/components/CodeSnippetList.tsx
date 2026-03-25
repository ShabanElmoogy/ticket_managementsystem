import React, { useState, useEffect } from 'react';
import {
  Box, Button, IconButton, TextField, Typography,
  Paper, Select, MenuItem, FormControl, InputLabel, CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import type { CodeSnippet } from '../../../services/api/types';

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'csharp', 'sql', 'bash', 'json', 'xml', 'other'];

interface Props {
  snippets: CodeSnippet[];
  canEdit: boolean;
  onSave: (snippets: CodeSnippet[]) => Promise<unknown>;
}

const CodeSnippetList: React.FC<Props> = ({ snippets: initial, canEdit, onSave }) => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>(initial);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<CodeSnippet>({ language: 'javascript', code: '', label: '' });

  useEffect(() => { setSnippets(initial); }, [initial]);

  const remove = (idx: number) => setSnippets(prev => prev.filter((_, i) => i !== idx));

  const addSnippet = () => {
    if (!draft.code.trim()) return;
    setSnippets(prev => [...prev, { ...draft, label: draft.label || undefined }]);
    setDraft({ language: 'javascript', code: '', label: '' });
    setAdding(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(snippets); } finally { setSaving(false); }
  };

  return (
    <Box sx={{ p: 2 }}>
      {snippets.map((s, idx) => (
        <Paper key={idx} variant="outlined" sx={{ mb: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', color: 'primary.main' }}>
              {s.language}{s.label ? ` — ${s.label}` : ''}
            </Typography>
            {canEdit && (
              <IconButton size="small" onClick={() => remove(idx)} sx={{ color: 'error.main' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Box
            component="pre"
            sx={{
              m: 0, p: 1.5, overflowX: 'auto', fontSize: '0.8rem', lineHeight: 1.6,
              fontFamily: 'monospace',
              bgcolor: theme => theme.palette.mode === 'dark' ? '#0d1117' : '#f6f8fa',
              color: theme => theme.palette.mode === 'dark' ? '#e6edf3' : '#24292f',
            }}
          >
            {s.code}
          </Box>
        </Paper>
      ))}

      {canEdit && adding && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box display="flex" gap={1} sx={{ mb: 1 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={draft.language}
                label="Language"
                onChange={e => setDraft(prev => ({ ...prev, language: e.target.value }))}
              >
                {LANGUAGES.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Label (optional)"
              value={draft.label}
              onChange={e => setDraft(prev => ({ ...prev, label: e.target.value }))}
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Code"
            value={draft.code}
            onChange={e => setDraft(prev => ({ ...prev, code: e.target.value }))}
            inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
            sx={{ mb: 1 }}
          />
          <Box display="flex" gap={1}>
            <Button size="small" variant="contained" onClick={addSnippet}>Add</Button>
            <Button size="small" onClick={() => setAdding(false)}>Cancel</Button>
          </Box>
        </Paper>
      )}

      {canEdit && (
        <Box display="flex" gap={1} sx={{ mt: 1 }}>
          {!adding && (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
              Add Snippet
            </Button>
          )}
          {snippets.length > 0 && (
            <Button
              size="small"
              variant="contained"
              startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              Save
            </Button>
          )}
        </Box>
      )}

      {snippets.length === 0 && !adding && (
        <Typography variant="body2" color="text.secondary">No code snippets added yet.</Typography>
      )}
    </Box>
  );
};

export default CodeSnippetList;
