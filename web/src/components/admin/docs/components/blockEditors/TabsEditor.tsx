import React, { useState } from 'react';
import {
  Box, Tabs, Tab, TextField, IconButton, Button, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { TabsBlock, TabItem, BlockSettings } from '../../types';
import { newId } from '../../types';

interface Props {
  block: TabsBlock;
  onChange: (p: Partial<TabsBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (p: Partial<BlockSettings>) => void;
}

const TabsEditor: React.FC<Props> = ({ block, onChange }) => {
  const tabs: TabItem[] = block.tabs?.length ? block.tabs : [{ id: newId(), label: 'Tab 1', content: '' }];
  const [active, setActive] = useState(0);

  const update = (patch: Partial<TabItem>, idx: number) => {
    const next = tabs.map((t, i) => i === idx ? { ...t, ...patch } : t);
    onChange({ tabs: next });
  };

  const addTab = () => {
    const next = [...tabs, { id: newId(), label: `Tab ${tabs.length + 1}`, content: '' }];
    onChange({ tabs: next });
    setActive(next.length - 1);
  };

  const removeTab = (idx: number) => {
    if (tabs.length === 1) return;
    const next = tabs.filter((_, i) => i !== idx);
    onChange({ tabs: next });
    setActive(Math.min(active, next.length - 1));
  };

  return (
    <Box>
      {/* Tab bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', mb: 0 }}>
        <Tabs
          value={active}
          onChange={(_, v) => setActive(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flex: 1, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, px: 1.5, textTransform: 'none', fontSize: '0.8rem' } }}
        >
          {tabs.map((tab, i) => (
            <Tab
              key={tab.id}
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  <span>{tab.label || `Tab ${i + 1}`}</span>
                  {tabs.length > 1 && (
                    <Tooltip title="Remove tab">
                      <IconButton
                        size="small" sx={{ p: 0.1, ml: 0.25 }}
                        onClick={e => { e.stopPropagation(); removeTab(i); }}
                      >
                        <DeleteIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
        <Tooltip title="Add tab">
          <IconButton size="small" onClick={addTab} sx={{ mx: 0.5 }}>
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Active tab editor */}
      {tabs[active] && (
        <Box sx={{ pt: 1.5 }}>
          <TextField
            size="small" fullWidth
            label="Tab label"
            value={tabs[active].label}
            onChange={e => update({ label: e.target.value }, active)}
            sx={{ mb: 1.5 }}
          />
          <TextField
            multiline minRows={4} fullWidth
            size="small"
            label="Tab content"
            placeholder="Write the content for this tab…"
            value={tabs[active].content}
            onChange={e => update({ content: e.target.value }, active)}
          />
        </Box>
      )}
    </Box>
  );
};

export default TabsEditor;
