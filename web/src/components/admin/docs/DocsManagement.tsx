import React, { useState } from 'react';
import { Box, Button, Stack, Tooltip } from '@mui/material';
import { ViewAgenda as GalleryIcon, Edit as EditIcon } from '@mui/icons-material';
import DocsBuilder from './DocsBuilder';
import DocsGallery from './DocsGallery';
import { useAdminReadonly } from '../AdminReadonlyContext';

type DocsView = 'gallery' | 'builder';

const DocsManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<DocsView>('gallery');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const readonly = useAdminReadonly();

  const handleEditDoc = (docId: string) => {
    if (readonly) return;
    setEditingDocId(docId);
    setCurrentView('builder');
  };

  const handleBackToGallery = () => {
    setCurrentView('gallery');
    setEditingDocId(null);
  };

  return (
    <Box>
      {/* View Toggle Buttons */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button
          variant={currentView === 'gallery' ? 'contained' : 'outlined'}
          startIcon={<GalleryIcon />}
          onClick={() => setCurrentView('gallery')}
        >
          Gallery
        </Button>
        <Tooltip title={readonly ? 'Read-only — subscription inactive' : ''} disableHoverListener={!readonly}>
          <span>
            <Button
              variant={currentView === 'builder' ? 'contained' : 'outlined'}
              startIcon={<EditIcon />}
              onClick={() => !readonly && setCurrentView('builder')}
              disabled={readonly}
            >
              Builder
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {/* Content */}
      {currentView === 'gallery' ? (
        <DocsGallery onEditDoc={handleEditDoc} />
      ) : (
        <DocsBuilder onBackToGallery={handleBackToGallery} editingDocId={editingDocId} />
      )}
    </Box>
  );
};

export default DocsManagement;
