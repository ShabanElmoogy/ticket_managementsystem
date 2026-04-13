import React from 'react';
import {
  Box, TextField, InputAdornment, IconButton, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

interface Props {
  searchTerm: string;
  viewMode: 'tree' | 'cards';
  onSearchChange: (value: string) => void;
  onViewModeChange: (mode: 'tree' | 'cards') => void;
}

const GalleryToolbar: React.FC<Props> = ({ searchTerm, viewMode, onSearchChange, onViewModeChange }) => (
  <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
    <TextField
      fullWidth
      variant="outlined"
      size="small"
      placeholder="Search documents..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onSearchChange('')} edge="end">
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
    />
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={(_, newView) => { if (newView) onViewModeChange(newView); }}
      size="small"
      sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}
    >
      <ToggleButton value="tree">
        <ViewListIcon sx={{ mr: { xs: 0, sm: 1 } }} />
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Tree View</Box>
      </ToggleButton>
      <ToggleButton value="cards">
        <ViewModuleIcon sx={{ mr: { xs: 0, sm: 1 } }} />
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Card View</Box>
      </ToggleButton>
    </ToggleButtonGroup>
  </Box>
);

export default GalleryToolbar;
