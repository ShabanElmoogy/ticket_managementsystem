import React, { useState } from 'react';
import {
  Box, Tabs, Tab, Tooltip, useTheme, alpha,
} from '@mui/material';
import {
  CollectionsBookmark as GalleryIcon,
  Edit as BuilderIcon,
  LockOutlined as LockIcon,
} from '@mui/icons-material';
import DocsBuilder from './DocsBuilder';
import DocsGallery from './DocsGallery';
import { useAdminReadonly } from '../AdminReadonlyContext';

type DocsView = 'gallery' | 'builder';

const DocsManagement: React.FC = () => {
  const theme = useTheme();
  const [view, setView] = useState<DocsView>('gallery');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const readonly = useAdminReadonly();

  const handleEditDoc = (docId: string) => {
    if (readonly) return;
    setEditingDocId(docId);
    setView('builder');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, mt: -3 }}>
      {/* ── Tab bar ── */}
      <Box sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 0,
        mb: 2,
      }}>
        <Tabs
          value={view}
          onChange={(_, v) => { if (v === 'builder' && readonly) return; setView(v); }}
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': {
              height: 2,
              borderRadius: '2px 2px 0 0',
              bgcolor: 'primary.main',
            },
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 2.5,
              gap: 0.75,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main', fontWeight: 600 },
              '&:hover:not(.Mui-selected)': {
                color: 'text.primary',
                bgcolor: alpha(theme.palette.action.hover, 0.5),
              },
            },
          }}
        >
          <Tab
            value="gallery"
            label="Gallery"
            icon={<GalleryIcon sx={{ fontSize: 17 }} />}
            iconPosition="start"
          />
          <Tab
            value="builder"
            label="Builder"
            icon={readonly
              ? <Tooltip title="Read-only — subscription inactive"><LockIcon sx={{ fontSize: 15 }} /></Tooltip>
              : <BuilderIcon sx={{ fontSize: 17 }} />
            }
            iconPosition="start"
            disabled={readonly}
          />
        </Tabs>
      </Box>

      {/* ── Content ── */}
      {view === 'gallery'
        ? <DocsGallery onEditDoc={handleEditDoc} />
        : <DocsBuilder onBackToGallery={() => setView('gallery')} editingDocId={editingDocId} />
      }
    </Box>
  );
};

export default DocsManagement;
