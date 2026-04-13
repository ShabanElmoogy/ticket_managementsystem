import React from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { Doc, TreeNode } from '../types';
import { DocumentCard, FolderCard } from './components';

interface Props {
  items: (TreeNode | Doc)[];
  currentPath: string[];
  currentFolderTitle: string | undefined;
  searchQuery?: string;
  onNavigateInto: (folderId: string) => void;
  onNavigateBack: () => void;
  onNavigateRoot: () => void;
  onPreview: (doc: Doc) => void;
}

const CardsBrowser: React.FC<Props> = ({
  items, currentPath, currentFolderTitle, searchQuery = '',
  onNavigateInto, onNavigateBack, onNavigateRoot, onPreview,
}) => (
  <Box>
    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
      {currentPath.length > 0 && (
        <Button startIcon={<ArrowBackIcon />} onClick={onNavigateBack} sx={{ mr: 2 }}>
          Back
        </Button>
      )}
      <Typography variant="h6">
        {currentPath.length > 0 ? `Documents in ${currentFolderTitle || 'Folder'}` : 'All Documents'}
      </Typography>
      {currentPath.length > 0 && (
        <Button size="small" onClick={onNavigateRoot} sx={{ ml: 'auto' }}>
          Show All
        </Button>
      )}
    </Box>

    <Grid container spacing={3}>
      {items.map((item) =>
        'blocks' in item ? (
          <DocumentCard key={item.id} doc={item} onPreview={onPreview} searchQuery={searchQuery} />
        ) : (
          <FolderCard key={item.id} folder={item} onNavigate={onNavigateInto} searchQuery={searchQuery} />
        )
      )}
    </Grid>

    {items.length === 0 && (
      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 6, py: 4 }}>
        {currentPath.length > 0 ? 'No items in this folder.' : 'No documents found.'}
      </Typography>
    )}
  </Box>
);

export default CardsBrowser;
