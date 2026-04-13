import React, { useState } from 'react';
import { Box, Tabs, Tab, useTheme, alpha } from '@mui/material';
import { Label as TemplateIcon, AccountTree as EpicsIcon } from '@mui/icons-material';
import TicketTemplatesTab from './components/TicketTemplatesTab';
import EpicTemplatesTab from './components/EpicTemplatesTab';

const TemplatesManagement: React.FC = () => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            gap: 0.75,
            '&.Mui-selected': { fontWeight: 600 },
            '&:hover:not(.Mui-selected)': {
              bgcolor: alpha(theme.palette.action.hover, 0.5),
            },
          },
        }}
      >
        <Tab icon={<TemplateIcon fontSize="small" />} iconPosition="start" label="Ticket Templates" />
        <Tab icon={<EpicsIcon fontSize="small" />}    iconPosition="start" label="Epic Templates"   />
      </Tabs>

      {tab === 0 ? <TicketTemplatesTab /> : <EpicTemplatesTab />}
    </Box>
  );
};

export default TemplatesManagement;
