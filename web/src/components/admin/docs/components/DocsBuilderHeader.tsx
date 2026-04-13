import React from 'react';
import { Box, Button, Divider, IconButton, Tooltip } from '@mui/material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import MenuIcon from '@mui/icons-material/Menu';
import MyGridHeader from '../../../common/layout/AppGridHeader';

interface Props {
  title: string;
  preview: boolean;
  saved: boolean;
  hasDoc: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onTogglePreview: () => void;
  onSave: () => void;
}

const DocsBuilderHeader: React.FC<Props> = ({
  title, preview, saved, hasDoc, sidebarOpen, onToggleSidebar, onTogglePreview, onSave,
}) => (
  <MyGridHeader
    title={title}
    icon={TextFieldsIcon}
    rightActions={
      <Box display="flex" gap={1} alignItems="center">
        <Tooltip title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
          <IconButton size="small" onClick={onToggleSidebar}>
            <MenuIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Button
          size="small"
          variant="outlined"
          startIcon={preview ? <EditIcon /> : <VisibilityIcon />}
          onClick={onTogglePreview}
        >
          {preview ? 'Edit' : 'Preview'}
        </Button>
        <Tooltip title="Save">
          <span>
            <Button
              size="small"
              variant="contained"
              color={saved ? 'success' : 'primary'}
              startIcon={saved ? <CheckIcon /> : <SaveIcon />}
              onClick={onSave}
              disabled={!hasDoc}
            >
              {saved ? 'Saved' : 'Save'}
            </Button>
          </span>
        </Tooltip>
      </Box>
    }
  />
);

export default DocsBuilderHeader;
