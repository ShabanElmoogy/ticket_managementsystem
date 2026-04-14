import React from 'react';
import { Box, TextField } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { ToggleBlock, BlockSettings } from '../../types';

const ToggleEditor: React.FC<{
  block: ToggleBlock;
  onChange: (p: Partial<ToggleBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (p: Partial<BlockSettings>) => void;
}> = ({ block, onChange }) => (
  <Box>
    <Box display="flex" alignItems="center" gap={1} mb={1}>
      <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
      <TextField size="small" fullWidth placeholder="Toggle heading…"
        value={block.summary ?? ''} onChange={e => onChange({ summary: e.target.value })}
        sx={{ '& .MuiOutlinedInput-root': { fontWeight: 600 } }} />
    </Box>
    <Box sx={{ pl: 3.5, borderLeft: '2px solid', borderColor: 'divider' }}>
      <TextField multiline minRows={2} fullWidth size="small" placeholder="Hidden content (shown when expanded)…"
        value={block.content ?? ''} onChange={e => onChange({ content: e.target.value })} />
    </Box>
  </Box>
);

export default ToggleEditor;
