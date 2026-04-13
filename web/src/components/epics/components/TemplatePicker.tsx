import React, { useState } from 'react';
import {
  Box, Typography, Paper, Chip, TextField, InputAdornment,
  CircularProgress, Tooltip, Button,
} from '@mui/material';
import { Search, CheckCircle, Category } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { epicTemplatesApi, type EpicTemplate } from '../api/epicTemplates';

interface Props {
  selected: EpicTemplate | null;
  onSelect: (t: EpicTemplate | null) => void;
}

const TemplatePicker: React.FC<Props> = ({ selected, onSelect }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['epic-templates'],
    queryFn: () => epicTemplatesApi.list(),
    staleTime: 60_000,
  });

  const categories = [...new Set(templates.map((t) => t.category))].sort();

  const filtered = templates.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || t.category === catFilter;
    return matchSearch && matchCat;
  });

  if (isLoading) return <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>;
  if (templates.length === 0) return (
    <Box py={2} textAlign="center">
      <Typography variant="body2" color="text.secondary">No templates available yet.</Typography>
    </Box>
  );

  return (
    <Box>
      <Box display="flex" gap={1} mb={1.5} flexWrap="wrap" alignItems="center">
        <TextField
          size="small" placeholder="Search templates…" value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 160 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
        />
        {categories.map((cat) => (
          <Chip
            key={cat} label={cat} size="small"
            icon={<Category fontSize="small" />}
            onClick={() => setCatFilter(catFilter === cat ? '' : cat)}
            color={catFilter === cat ? 'primary' : 'default'}
            variant={catFilter === cat ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {selected && (
        <Box mb={1.5} display="flex" alignItems="center" gap={1}>
          <CheckCircle fontSize="small" color="success" />
          <Typography variant="body2" fontWeight={600}>{selected.name}</Typography>
          <Button size="small" onClick={() => onSelect(null)} sx={{ ml: 'auto', fontSize: 11 }}>
            Clear
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, maxHeight: 260, overflowY: 'auto', pr: 0.5 }}>
        {filtered.map((t) => {
          const isSelected = selected?.id === t.id;
          return (
            <Tooltip
              key={t.id}
              title={
                <Box>
                  {t.description && <Typography variant="caption" display="block" mb={0.5}>{t.description}</Typography>}
                  <Typography variant="caption">{t.features.length} feature{t.features.length !== 1 ? 's' : ''}</Typography>
                  {t.features.slice(0, 4).map((f, i) => (
                    <Typography key={i} variant="caption" display="block" sx={{ pl: 1 }}>• {f.title}</Typography>
                  ))}
                  {t.features.length > 4 && <Typography variant="caption" sx={{ pl: 1 }}>…and {t.features.length - 4} more</Typography>}
                </Box>
              }
              placement="right"
            >
              <Paper
                onClick={() => onSelect(isSelected ? null : t)}
                sx={{
                  p: 1.5, cursor: 'pointer', borderRadius: 2,
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  '&:hover': { borderColor: 'primary.light', boxShadow: 1 },
                  transition: 'all 0.15s',
                }}
              >
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={0.5}>
                  <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>{t.name}</Typography>
                  {isSelected && <CheckCircle fontSize="small" color="primary" sx={{ flexShrink: 0 }} />}
                </Box>
                <Chip label={t.category} size="small" sx={{ mt: 0.75, fontSize: 10, height: 18 }} />
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  {t.features.length} feature{t.features.length !== 1 ? 's' : ''}
                </Typography>
              </Paper>
            </Tooltip>
          );
        })}
      </Box>

      {filtered.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          No templates match your search
        </Typography>
      )}
    </Box>
  );
};

export default TemplatePicker;
