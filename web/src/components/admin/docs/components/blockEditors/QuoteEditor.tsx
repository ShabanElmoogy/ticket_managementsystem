import React from 'react';
import { Box, TextField } from '@mui/material';
import type { QuoteBlock, BlockSettings } from '../../types';

const QuoteEditor: React.FC<{
  block: QuoteBlock;
  onChange: (p: Partial<QuoteBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (p: Partial<BlockSettings>) => void;
}> = ({ block, onChange }) => (
  <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 2 }}>
    <TextField multiline minRows={2} fullWidth size="small" placeholder="Quote text…"
      value={block.text ?? ''} onChange={e => onChange({ text: e.target.value })}
      sx={{ mb: 1, '& .MuiOutlinedInput-root': { fontStyle: 'italic', fontSize: '1.05rem' } }} />
    <TextField fullWidth size="small" placeholder="— Attribution (optional)"
      value={block.attribution ?? ''} onChange={e => onChange({ attribution: e.target.value })} />
  </Box>
);

export default QuoteEditor;
