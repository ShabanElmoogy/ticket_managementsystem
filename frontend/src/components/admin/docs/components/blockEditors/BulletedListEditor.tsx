import React from 'react';
import {
  Box,
  TextField,
  Stack,
  Tooltip,
  IconButton,
  Button,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BlockSettingsBar from '../BlockSettingsBar';
import { BulletedListBlock, BlockSettings } from '../../types/types';

const BulletedListEditor: React.FC<{
  block: BulletedListBlock;
  onChange: (patch: Partial<BulletedListBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  const addItem = () => onChange({ items: [...block.items, ''] });
  const removeItem = (idx: number) => onChange({ items: block.items.filter((_, i) => i !== idx) });
  const moveItem = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= block.items.length) return;
    const copy = [...block.items];
    const [item] = copy.splice(idx, 1);
    copy.splice(to, 0, item);
    onChange({ items: copy });
  };
  const updateItem = (idx: number, val: string) => {
    const copy = [...block.items];
    copy[idx] = val;
    onChange({ items: copy });
  };
  return (
    <Box>
      <Box sx={{ textAlign: settings.align || 'left', color: settings.color || 'inherit' }}>
        <TextField fullWidth variant="standard" placeholder="List title" value={block.title || ''} onChange={(e) => onChange({ title: e.target.value })} sx={{ mb: 1 }} />
        {block.items.map((it, idx) => (
          <Stack key={idx} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <TextField fullWidth size="small" placeholder={`Item ${idx + 1}`} value={it} onChange={(e) => updateItem(idx, e.target.value)} />
            <Tooltip title="Move up"><span><IconButton size="small" disabled={idx === 0} onClick={() => moveItem(idx, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
            <Tooltip title="Move down"><span><IconButton size="small" disabled={idx === block.items.length - 1} onClick={() => moveItem(idx, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
            <Tooltip title="Remove"><IconButton size="small" color="error" onClick={() => removeItem(idx)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
          </Stack>
        ))}
        <Button startIcon={<AddIcon />} variant="outlined" onClick={addItem}>Add Item</Button>
      </Box>
      <BlockSettingsBar settings={settings} onSettingsChange={onSettingsChange} enableColor enableAlign />
    </Box>
  );
};

export default BulletedListEditor;