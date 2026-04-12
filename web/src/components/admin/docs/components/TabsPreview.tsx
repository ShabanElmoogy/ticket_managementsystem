import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import type { TabItem } from '../types';

interface Props { tabs: TabItem[] }

const TabsPreview: React.FC<Props> = ({ tabs }) => {
  const [active, setActive] = useState(0);
  if (!tabs.length) return null;
  return (
    <Box>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={active}
          onChange={(_, v) => setActive(v)}
          sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontSize: '0.85rem' } }}
        >
          {tabs.map((t, i) => <Tab key={t.id} label={t.label || `Tab ${i + 1}`} />)}
        </Tabs>
      </Box>
      <Box sx={{ pt: 1.5 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {tabs[active]?.content}
        </Typography>
      </Box>
    </Box>
  );
};

export default TabsPreview;
