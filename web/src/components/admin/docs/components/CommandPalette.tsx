import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, alpha, useTheme,
} from '@mui/material';
import type { BlockType } from '../types';
import { PALETTE_ITEMS } from './blockPaletteConfig';

const ICON_CHARS: Partial<Record<BlockType, string>> = {
  heading:       'H',
  text:          'T',
  quote:         '"',
  callout:       'ℹ',
  code:          '</>',
  bulletedList:  '•',
  numberedList:  '1.',
  toggle:        '▶',
  tabs:          '⊞',
  table:         '⊟',
  image:         '🖼',
  video:         '▶',
  videoCarousel: '⏯',
  divider:       '—',
};

interface Props {
  open: boolean;
  query: string;
  anchorEl: HTMLElement | null;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  onQueryChange: (q: string) => void;
}

const CommandPalette: React.FC<Props> = ({ open, query, anchorEl, onSelect, onClose, onQueryChange }) => {
  const theme = useTheme();
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = PALETTE_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.type.toLowerCase().includes(query.toLowerCase()),
  );

  // Reset active index when query changes
  useEffect(() => { setActiveIdx(0); }, [query]);

  // Keyboard navigation + query tracking
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter')     { e.preventDefault(); if (filtered[activeIdx]) onSelect(filtered[activeIdx].type); return; }
      if (e.key === 'Escape')    { e.preventDefault(); onClose(); return; }
      // Query tracking — printable chars build the search query
      if (e.key === 'Backspace') { e.preventDefault(); onQueryChange(query.slice(0, -1)); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onQueryChange(query + e.key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, activeIdx, onSelect, onClose, onQueryChange, query]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open || !anchorEl || filtered.length === 0) return null;

  const rect = anchorEl.getBoundingClientRect();

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 9999,
        width: 260,
        maxHeight: 320,
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {query ? `Blocks matching "${query}"` : 'Insert block'}
        </Typography>
      </Box>
      <Box ref={listRef} sx={{ overflowY: 'auto', maxHeight: 270, py: 0.5 }}>
        {filtered.map((item, i) => (
          <Box
            key={item.type}
            data-idx={i}
            onClick={() => onSelect(item.type)}
            onMouseEnter={() => setActiveIdx(i)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              px: 1.5, py: 0.75, cursor: 'pointer',
              bgcolor: i === activeIdx ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <Box sx={{
              width: 28, height: 28, borderRadius: 1, flexShrink: 0,
              bgcolor: alpha(item.color, 0.15),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: item.color, fontSize: '0.7rem', fontWeight: 700,
            }}>
              {ICON_CHARS[item.type] ?? item.label[0]}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.2 }}>{item.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>/{item.type}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default CommandPalette;
