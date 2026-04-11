import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { AccountTree, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Epic } from '../../../services/api/types';

interface Props {
  ancestors: { id: string; title: string; status: Epic['status'] }[];
  current: string;
}

const EpicBreadcrumb: React.FC<Props> = ({ ancestors, current }) => {
  const navigate = useNavigate();

  if (!ancestors.length) return null;

  return (
    <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap" mb={1.5}>
      <AccountTree sx={{ fontSize: 14, color: 'text.secondary' }} />
      {ancestors.map((a) => (
        <React.Fragment key={a.id}>
          <Chip
            label={a.title}
            size="small"
            variant="outlined"
            onClick={() => navigate(`/epics/${a.id}`)}
            sx={{
              height: 22,
              fontSize: '0.72rem',
              cursor: 'pointer',
              maxWidth: 200,
              '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
              '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
            }}
          />
          <ChevronRight sx={{ fontSize: 14, color: 'text.disabled' }} />
        </React.Fragment>
      ))}
      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
        {current}
      </Typography>
    </Box>
  );
};

export default EpicBreadcrumb;
