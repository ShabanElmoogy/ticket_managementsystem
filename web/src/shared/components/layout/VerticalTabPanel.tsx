import React, { useState } from 'react';
import { Box, Tab, Tabs, useTheme, alpha } from '@mui/material';

export interface VerticalTab {
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

interface Props {
  tabs: VerticalTab[];
  minHeight?: number;
  tabWidth?: number;
}

const VerticalTabPanel: React.FC<Props> = ({ tabs, minHeight = 300, tabWidth = 160 }) => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ display: 'flex', minHeight }}>
      <Tabs
        orientation="vertical"
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          borderRight: 1,
          borderColor: 'divider',
          minWidth: tabWidth,
          flexShrink: 0,
          '& .MuiTabs-scroller': { mt: 0 },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.82rem',
            minHeight: 40,
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            gap: 1,
            px: 2,
            '&.Mui-selected': { fontWeight: 700 },
            '&:hover:not(.Mui-selected)': {
              bgcolor: alpha(theme.palette.action.hover, 0.5),
            },
          },
          '& .MuiTabs-indicator': { left: 0, right: 'auto', width: 3, borderRadius: '0 2px 2px 0' },
        }}
      >
        {tabs.map((t, i) => (
          <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
        ))}
      </Tabs>
      <Box sx={{ flex: 1, pl: 3 }}>
        {tabs[tab]?.content}
      </Box>
    </Box>
  );
};

export default VerticalTabPanel;
