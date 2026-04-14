import React, { useState, useRef } from 'react';
import { Box, Popover, Typography, alpha, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { BlockType } from '../types';
import { PALETTE_ITEMS } from './blockPaletteConfig';

interface Props {
  onAdd: (type: BlockType) => void;
}

const AddBlockDivider: React.FC<Props> = ({ onAdd }) => {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  const open = Boolean(anchor);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchor(btnRef.current);
  };

  const handleSelect = (type: BlockType) => {
    onAdd(type);
    setAnchor(null);
  };

  return (
    <>
      <Box
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          position: 'relative',
          height: 20,
          display: 'flex',
          alignItems: 'center',
          mx: 1,
          my: 0,
          cursor: 'pointer',
          opacity: hovered || open ? 1 : 0,
          transition: 'opacity 0.15s',
          '&:hover': { opacity: 1 },
        }}
      >
        {/* Horizontal line */}
        <Box sx={{
          flex: 1,
          height: '1px',
          bgcolor: alpha(theme.palette.primary.main, 0.35),
        }} />

        {/* + button */}
        <Box
          ref={btnRef}
          onClick={handleClick}
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
            '&:hover': { bgcolor: 'primary.dark' },
            transition: 'background 0.15s',
          }}
        >
          <AddIcon sx={{ fontSize: 14 }} />
        </Box>
      </Box>

      {/* Block picker popover */}
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        disableScrollLock
        slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 2, boxShadow: 4 } } }}
      >
        <Box sx={{ p: 1, width: 260 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ px: 0.5, display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Add block
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {PALETTE_ITEMS.map((item) => (
              <Box
                key={item.type}
                onClick={() => handleSelect(item.type)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  width: 'calc(50% - 2px)',
                  '&:hover': { bgcolor: alpha(item.color, 0.1) },
                  transition: 'background 0.1s',
                }}
              >
                <Box sx={{
                  width: 20, height: 20, borderRadius: 0.75, flexShrink: 0,
                  bgcolor: alpha(item.color, 0.15),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                </Box>
                <Typography variant="caption" fontWeight={500} noWrap>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default AddBlockDivider;
