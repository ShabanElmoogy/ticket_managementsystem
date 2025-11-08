import React from 'react';
import { Box } from '@mui/material';
import DocsGallery from '../components/admin/docs/DocsGallery';

const DocumentsPage: React.FC = () => {
  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default' }}>
      <DocsGallery />
    </Box>
  );
};

export default DocumentsPage;