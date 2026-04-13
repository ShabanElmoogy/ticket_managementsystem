import React from 'react';
import { Box, TextField } from '@mui/material';
import BlockSettingsBar from '../BlockSettingsBar';
import type { HeadingBlock, BlockSettings } from '../../types';

const HeadingBlockEditor: React.FC<{
  block: HeadingBlock;
  onChange: (patch: Partial<HeadingBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  return (
    <Box>
      <TextField
        fullWidth
        variant="standard"
        placeholder="Heading"
        value={block.text}
        onChange={(e) => onChange({ text: e.target.value })}
        slotProps={{
          input: {
            sx: {
              fontSize: 28,
              fontWeight: 700,
              textAlign: settings.align || 'left',
              color: settings.color || 'inherit',
            },
          },
        }}
      />
      <BlockSettingsBar settings={settings} onSettingsChange={onSettingsChange} enableColor enableAlign />
    </Box>
  );
};

export default HeadingBlockEditor;