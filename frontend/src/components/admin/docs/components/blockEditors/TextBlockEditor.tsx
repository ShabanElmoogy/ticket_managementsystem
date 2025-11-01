import React, { useRef } from 'react';
import {
  Stack,
  Tooltip,
  IconButton,
  Box,
  alpha,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import BlockSettingsBar from '../BlockSettingsBar';
import { TextBlock, BlockSettings } from '../../types/types';

const TextToolbar: React.FC = () => {
  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
  };
  return (
    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
      <Tooltip title="Bold"><IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}><FormatBoldIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Italic"><IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}><FormatItalicIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Underline"><IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}><FormatUnderlinedIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Bulleted list"><IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}><FormatListBulletedIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Numbered list"><IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')}><FormatListNumberedIcon fontSize="small" /></IconButton></Tooltip>
    </Stack>
  );
};

const TextBlockEditor: React.FC<{
  block: TextBlock;
  onChange: (patch: Partial<TextBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Box>
      <TextToolbar />
      <Box
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange({ html: (e.currentTarget as HTMLDivElement).innerHTML })}
        dangerouslySetInnerHTML={{ __html: block.html || '' }}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.5,
          minHeight: 80,
          '&:focus': { outline: 'none', borderColor: 'primary.main', boxShadow: (t) => `0 0 0 2px ${alpha(t.palette.primary.main, 0.15)}` },
          textAlign: settings.align || 'left',
          color: settings.color || 'inherit',
        }}
      />
      <BlockSettingsBar settings={settings} onSettingsChange={onSettingsChange} enableColor enableAlign />
    </Box>
  );
};

export default TextBlockEditor;