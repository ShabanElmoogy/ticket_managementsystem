import React, { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { ViewAgenda as GalleryIcon, Edit as EditIcon } from '@mui/icons-material';
import DocsBuilder from './DocsBuilder';
import DocsGallery from './DocsGallery';

type DocsView = 'gallery' | 'builder';

const DocsManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<DocsView>('gallery');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  const handleEditDoc = (docId: string) => {
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
        <Button
          variant={currentView === 'builder' ? 'contained' : 'outlined'}
          startIcon={<EditIcon />}
          onClick={() => setCurrentView('builder')}
        >
          Builder
        </Button>
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
