import React from 'react';
import { Box, TextField, IconButton, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { NumberedListBlock, BlockSettings } from '../../types';

const NumberedListEditor: React.FC<{
  block: NumberedListBlock;
  onChange: (p: Partial<NumberedListBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (p: Partial<BlockSettings>) => void;
}> = ({ block, onChange }) => {
  const items = block.items ?? [''];
  const update = (i: number, val: string) => { const next = [...items]; next[i] = val; onChange({ items: next }); };
  const add    = () => onChange({ items: [...items, ''] });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });

  return (
    <Box>
      <TextField size="small" fullWidth placeholder="List title (optional)" value={block.title ?? ''} onChange={e => onChange({ title: e.target.value })} sx={{ mb: 1.5 }} />
      {items.map((item, i) => (
        <Box key={i} display="flex" alignItems="center" gap={1} mb={0.75}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: 'right', fontWeight: 600 }}>{i + 1}.</Typography>
          <TextField size="small" fullWidth value={item} placeholder={`Item ${i + 1}`} onChange={e => update(i, e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } if (e.key === 'Backspace' && !item && items.length > 1) { e.preventDefault(); remove(i); } }} />
          {items.length > 1 && <IconButton size="small" color="error" onClick={() => remove(i)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>}
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={add} sx={{ mt: 0.5 }}>Add item</Button>
    </Box>
  );
};

export default NumberedListEditor;
