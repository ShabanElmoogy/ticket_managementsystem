import React from 'react';
import {
  Stack,
  Tooltip,
  IconButton,
  Typography,
  TextField,
} from '@mui/material';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import type { BlockSettings } from '../types';

// Block settings toolbar
const BlockSettingsBar: React.FC<{
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
  enableAlign?: boolean;
  enableColor?: boolean;
  enableDivider?: boolean;
}> = ({ settings, onSettingsChange, enableAlign, enableColor, enableDivider }) => {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      {enableAlign && (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Align left"><IconButton size="small" onClick={() => onSettingsChange({ align: 'left' })}><AlignHorizontalLeftIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Align center"><IconButton size="small" onClick={() => onSettingsChange({ align: 'center' })}><AlignHorizontalCenterIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Align right"><IconButton size="small" onClick={() => onSettingsChange({ align: 'right' })}><AlignHorizontalRightIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
      )}
      {enableColor && (
        <Stack direction="row" spacing={1} alignItems="center">
          <ColorLensIcon fontSize="small" />
          <input type="color" value={settings.color || '#000000'} onChange={(e) => onSettingsChange({ color: e.target.value })} />
        </Stack>
      )}
      {enableDivider && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption">Color:</Typography>
          <input type="color" value={settings.dividerColor || '#e0e0e0'} onChange={(e) => onSettingsChange({ dividerColor: e.target.value })} />
          <Typography variant="caption">Thickness:</Typography>
          <TextField type="number" size="small" value={settings.dividerThickness || 1} onChange={(e) => onSettingsChange({ dividerThickness: parseInt(e.target.value || '1', 10) })} sx={{ width: 80 }} />
        </Stack>
      )}
    </Stack>
  );
};

export default BlockSettingsBar;