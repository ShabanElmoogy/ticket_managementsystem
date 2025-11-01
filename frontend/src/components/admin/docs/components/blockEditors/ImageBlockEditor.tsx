import React from 'react';
import { Box, TextField } from '@mui/material';
import BlockSettingsBar from '../BlockSettingsBar';
import { ImageBlock, BlockSettings } from '../../types/types';

const ImageBlockEditor: React.FC<{
  block: ImageBlock;
  onChange: (patch: Partial<ImageBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        label="Image URL"
        placeholder="https://..."
        value={block.url}
        onChange={(e) => onChange({ url: e.target.value })}
        sx={{ mb: 1 }}
      />
      {block.url && (
        <Box sx={{ textAlign: settings.align || 'center', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', p: 1 }}>
          <img src={block.url} alt={block.caption || 'image'} style={{ maxWidth: '100%', borderRadius: 8 }} />
        </Box>
      )}
      <TextField
        fullWidth
        variant="standard"
        placeholder="Caption (optional)"
        value={block.caption || ''}
        onChange={(e) => onChange({ caption: e.target.value })}
        sx={{ mt: 1 }}
      />
      <BlockSettingsBar settings={settings} onSettingsChange={onSettingsChange} enableAlign />
    </Box>
  );
};

export default ImageBlockEditor;