import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Divider, IconButton, InputBase, Tooltip } from '@mui/material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SyncIcon from '@mui/icons-material/Sync';
import MenuIcon from '@mui/icons-material/Menu';
import MyGridHeader from '../../../../shared/components/layout/AppGridHeader';
import type { SaveStatus } from '../hooks/useDocsStore';

interface Props {
  title: string;
  preview: boolean;
  saveStatus: SaveStatus;
  hasDoc: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onTogglePreview: () => void;
  onSave: () => void;
  onRenameTitle: (title: string) => void;
}

const STATUS_CONFIG: Record<SaveStatus, {
  label: string;
  color: 'default' | 'primary' | 'success' | 'error';
  icon: React.ReactNode;
}> = {
  idle:   { label: 'Save',                color: 'primary', icon: <SaveIcon sx={{ fontSize: 14 }} /> },
  saving: { label: 'Saving…',            color: 'default', icon: <SyncIcon sx={{ fontSize: 14, animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} /> },
  saved:  { label: 'Saved',              color: 'success', icon: <CheckIcon sx={{ fontSize: 14 }} /> },
  error:  { label: 'Save failed — retry', color: 'error',   icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} /> },
};

// ── Inline editable title ─────────────────────────────────────────────────────

const EditableTitle: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft when the external value changes (e.g. switching docs)
  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    else setDraft(value); // revert if empty or unchanged
  };

  if (!editing) {
    return (
      <Tooltip title="Click to rename" placement="bottom">
        <Box
          component="span"
          onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.select(), 50); }}
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.1rem', md: '1.4rem' },
            cursor: 'text',
            borderBottom: '2px dashed transparent',
            '&:hover': { borderBottomColor: 'primary.main' },
            transition: 'border-color 0.15s',
            lineHeight: 1.3,
            maxWidth: { xs: 160, sm: 280, md: 400 },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'inline-block',
          }}
        >
          {value || 'Untitled'}
        </Box>
      </Tooltip>
    );
  }

  return (
    <InputBase
      inputRef={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      }}
      autoFocus
      sx={{
        fontWeight: 600,
        fontSize: { xs: '1.1rem', md: '1.4rem' },
        lineHeight: 1.3,
        minWidth: 120,
        maxWidth: { xs: 160, sm: 280, md: 400 },
        '& .MuiInputBase-input': {
          p: 0,
          borderBottom: '2px solid',
          borderColor: 'primary.main',
        },
      }}
    />
  );
};

// ── Header ────────────────────────────────────────────────────────────────────

const DocsBuilderHeader: React.FC<Props> = ({
  title, preview, saveStatus, hasDoc, sidebarOpen,
  onToggleSidebar, onTogglePreview, onSave, onRenameTitle,
}) => {
  const cfg = STATUS_CONFIG[saveStatus];

  return (
    <MyGridHeader
      title={hasDoc ? <EditableTitle value={title} onChange={onRenameTitle} /> : title}
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
          <Tooltip title={saveStatus === 'idle' ? 'Save now (auto-saves after 1.5 s)' : cfg.label}>
            <span>
              <Button
                size="small"
                variant={saveStatus === 'error' ? 'contained' : 'outlined'}
                color={cfg.color}
                startIcon={cfg.icon}
                onClick={onSave}
                disabled={!hasDoc || saveStatus === 'saving'}
              >
                {cfg.label}
              </Button>
            </span>
          </Tooltip>
        </Box>
      }
    />
  );
};

export default DocsBuilderHeader;
