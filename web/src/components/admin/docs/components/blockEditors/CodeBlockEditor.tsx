import React from 'react';
import { Box, TextField, MenuItem } from '@mui/material';
import BlockSettingsBar from '../BlockSettingsBar';
import type { CodeBlock, BlockSettings } from '../../types';

const languages = [
  'javascript',
  'typescript',
  'python',
  'java',
  'csharp',
  'cpp',
  'c',
  'php',
  'ruby',
  'go',
  'rust',
  'swift',
  'kotlin',
  'scala',
  'html',
  'css',
  'sql',
  'bash',
  'json',
  'xml',
  'yaml',
  'markdown',
];

const CodeBlockEditor: React.FC<{
  block: CodeBlock;
  onChange: (patch: Partial<CodeBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  return (
    <Box>
      <TextField
        select
        fullWidth
        variant="outlined"
        size="small"
        label="Language"
        value={block.language}
        onChange={(e) => onChange({ language: e.target.value })}
        sx={{ mb: 2 }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang} value={lang}>
            {lang}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        multiline
        rows={6}
        variant="outlined"
        placeholder="Enter your code here..."
        value={block.code}
        onChange={(e) => onChange({ code: e.target.value })}
        slotProps={{
          input: {
            sx: {
              fontFamily: 'monospace',
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

export default CodeBlockEditor;