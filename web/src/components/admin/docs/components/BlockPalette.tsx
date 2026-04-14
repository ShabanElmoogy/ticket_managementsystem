import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import TitleIcon from '@mui/icons-material/Title';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import InfoIcon from '@mui/icons-material/Info';
import TableChartIcon from '@mui/icons-material/TableChart';
import TabIcon from '@mui/icons-material/Tab';
import CodeIcon from '@mui/icons-material/Code';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { BlockType } from '../types';

const ICON_MAP: Record<BlockType, React.ReactNode> = {
  heading:       <TitleIcon sx={{ fontSize: 16 }} />,
  text:          <TextFieldsIcon sx={{ fontSize: 16 }} />,
  quote:         <FormatQuoteIcon sx={{ fontSize: 16 }} />,
  callout:       <InfoIcon sx={{ fontSize: 16 }} />,
  code:          <CodeIcon sx={{ fontSize: 16 }} />,
  bulletedList:  <FormatListBulletedIcon sx={{ fontSize: 16 }} />,
  numberedList:  <FormatListNumberedIcon sx={{ fontSize: 16 }} />,
  toggle:        <ExpandMoreIcon sx={{ fontSize: 16 }} />,
  tabs:          <TabIcon sx={{ fontSize: 16 }} />,
  table:         <TableChartIcon sx={{ fontSize: 16 }} />,
  image:         <ImageIcon sx={{ fontSize: 16 }} />,
  video:         <MovieIcon sx={{ fontSize: 16 }} />,
  videoCarousel: <VideoLibraryIcon sx={{ fontSize: 16 }} />,
  divider:       <HorizontalRuleIcon sx={{ fontSize: 16 }} />,
};

const PALETTE: { type: BlockType; label: string; color: string }[] = [
  { type: 'heading',       label: 'Heading',        color: '#f59e0b' },
  { type: 'text',          label: 'Text',           color: '#3b82f6' },
  { type: 'quote',         label: 'Quote',          color: '#8b5cf6' },
  { type: 'callout',       label: 'Callout',        color: '#06b6d4' },
  { type: 'code',          label: 'Code',           color: '#6366f1' },
  { type: 'bulletedList',  label: 'Bullet List',    color: '#10b981' },
  { type: 'numberedList',  label: 'Numbered List',  color: '#14b8a6' },
  { type: 'toggle',        label: 'Toggle',         color: '#f97316' },
  { type: 'tabs',          label: 'Tabs',           color: '#a855f7' },
  { type: 'table',         label: 'Table',          color: '#ec4899' },
  { type: 'image',         label: 'Image',          color: '#0ea5e9' },
  { type: 'video',         label: 'Video',          color: '#ef4444' },
  { type: 'videoCarousel', label: 'Video Carousel', color: '#f43f5e' },
  { type: 'divider',       label: 'Divider',        color: '#6b7280' },
];

interface Props {
  onAdd: (type: BlockType) => void;
  sidebarBg: string;
  sidebarBorder: string;
  hoverBg: string;
  horizontal?: boolean;
}

const BlockPalette: React.FC<Props> = ({ onAdd, sidebarBg, sidebarBorder, hoverBg, horizontal }) => {
  if (horizontal) {
    return (
      <>
        {PALETTE.map((p) => (
          <Box
            key={p.type}
            onClick={() => onAdd(p.type)}
            sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
              px: 1.5, py: 1, borderRadius: 1, cursor: 'pointer', flexShrink: 0,
              '&:hover': { bgcolor: hoverBg }, transition: 'background 0.1s',
            }}
          >
            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: alpha(p.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>
              {ICON_MAP[p.type]}
            </Box>
            <Typography variant="caption" fontSize="0.65rem" fontWeight={500} noWrap>{p.label}</Typography>
          </Box>
        ))}
      </>
    );
  }

  return (
    <Box sx={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', bgcolor: sidebarBg, borderLeft: `1px solid ${sidebarBorder}`, overflow: 'hidden' }}>
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: `1px solid ${sidebarBorder}` }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
          Blocks
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {PALETTE.map((p) => (
          <Box
            key={p.type}
            onClick={() => onAdd(p.type)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 0.75, mx: 0.5, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: hoverBg }, transition: 'background 0.1s' }}
          >
            <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: alpha(p.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: p.color }}>
              {ICON_MAP[p.type]}
            </Box>
            <Typography variant="body2" fontSize="0.78rem" fontWeight={500}>{p.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default BlockPalette;
